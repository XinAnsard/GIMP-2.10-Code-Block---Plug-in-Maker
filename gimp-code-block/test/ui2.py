import asyncio, os, sys, pathlib
from playwright.async_api import async_playwright
HTML = pathlib.Path('/home/claude/repo/gimp-code-block/dist/gimp-code-block.html').read_text()
BL = '/home/claude/node_modules/blockly/'
async def route(r):
    u = r.request.url
    if u.startswith('https://x.test/'):
        await r.fulfill(status=200, content_type='text/html; charset=utf-8', body=HTML); return
    if 'jsdelivr' in u:
        f = BL + u.split('blockly@10.4.3/')[1]
        try: await r.fulfill(status=200, content_type='application/javascript', body=pathlib.Path(f).read_text())
        except Exception: await r.fulfill(status=404, body='')
    else: await r.continue_()
async def mk(pw, lang=None):
    b = await pw.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args=['--no-sandbox'])
    ctx = await b.new_context(viewport={'width': 1500, 'height': 950})
    p = await ctx.new_page()
    errs = []
    p.on('pageerror', lambda e: errs.append(str(e)))
    p.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' else None)
    await p.route('**/*', route)
    if lang: await p.add_init_script("localStorage.setItem('atelier-gimp-lang', '\"%s\"'.slice(1,-1));" % lang)
    await p.goto('https://x.test/atelier.html')
    await p.wait_for_selector('#blockly .blocklyWorkspace', timeout=45000)
    await p.wait_for_timeout(900)
    await p.evaluate("document.querySelector('#overlay.open .foot .primary')?.click()")
    return b, p, errs
async def main():
    async with async_playwright() as pw:
        b, p, errs = await mk(pw, 'fr')
        R = []
        # menus
        await p.click('.mb:first-child .mbBtn'); await p.wait_for_timeout(200)
        R.append('menu Fichier ouvert: ' + str(await p.is_visible('#mImport')))
        await p.keyboard.press('Escape'); await p.click('body', position={'x': 700, 'y': 500})
        # charger un gros script
        await p.set_input_files('#fileOpen', (os.environ.get('BIG') or 'test/fixtures/example_manga.py'))
        await p.wait_for_timeout(1500)
        await p.evaluate("document.querySelector('#overlay.open [data-a=ok]')?.click()")
        await p.wait_for_timeout(6000)
        await p.evaluate("document.querySelector('#overlay.open .foot .primary')?.click()")
        n = await p.evaluate("GA.ws.getAllBlocks(false).length"); R.append('blocs BubbleOCR: %d' % n)
        # liste des fonctions
        await p.evaluate("GA.openFunctions()"); await p.wait_for_timeout(700)
        R.append('liste fonctions: %d' % await p.eval_on_selector_all('#fnL .pick', 'e=>e.length'))
        await p.evaluate("GA.app.closeDialog()")
        # tout déplier / replier
        await p.evaluate("GA.collapseFunctions()"); await p.wait_for_timeout(900)
        R.append('repliés: %d' % await p.evaluate("GA.ws.getAllBlocks(false).filter(b=>b.isCollapsed()).length"))
        await p.evaluate("GA.expandAll()"); await p.wait_for_timeout(2500)
        R.append('après dépliage: %d' % await p.evaluate("GA.ws.getAllBlocks(false).filter(b=>b.isCollapsed()).length"))
        # sélection multiple + copie + collage + suppression
        sel = await p.evaluate("""(() => { const hat = GA.getHat(GA.ws); let b = hat.getInputTargetBlock('DO'), out=[]; while(b && out.length<4){ out.push(b.id); b=b.getNextBlock(); } out.forEach(id=>GA.selToggle(GA.ws.getBlockById(id), true)); return GA.selBlocks().length; })()""")
        R.append('sélection: %d' % sel)
        code = await p.evaluate("GA.codeOfRuns(GA.selRuns())")
        R.append('code sélection: %d lignes' % len(code.strip().split('\n')))
        before = await p.evaluate("GA.ws.getAllBlocks(false).length")
        await p.evaluate("GA.copySel(false)"); await p.wait_for_timeout(300)
        await p.evaluate("GA.pasteInternal()"); await p.wait_for_timeout(600)
        after = await p.evaluate("GA.ws.getAllBlocks(false).length")
        R.append('collage ajoute %d blocs' % (after - before))
        await p.evaluate("GA.deleteSel()"); await p.wait_for_timeout(500)
        R.append('après suppression: %d' % (await p.evaluate("GA.ws.getAllBlocks(false).length") - before))
        # rechercher/remplacer
        await p.keyboard.press('Control+f'); await p.wait_for_timeout(300)
        await p.fill('#fQ', 'image'); await p.wait_for_timeout(700)
        R.append('recherche: ' + await p.inner_text('#fN'))
        R.append('langue FR: ' + (await p.inner_text('.mb:nth-child(4) .mbBtn')) + ' / ' + await p.evaluate("GA.ws.getAllBlocks(false).length > 0 ? document.querySelector('#t-check').textContent.trim() : ''"))
        await p.click('#fClose')
        # apparence
        await p.evaluate("GA.openAppearance()"); await p.wait_for_timeout(500)
        await p.click('.preset[data-p=contraste]'); await p.wait_for_timeout(900)
        R.append('palette: ' + await p.evaluate("GA.prefs.palette") + ' / thème: ' + await p.evaluate("GA.prefs.theme"))
        await p.click('#apOk'); await p.wait_for_timeout(400)
        await p.evaluate("document.querySelector('#overlay.open [data-a=cancel],#overlay.open .btn')?.click()"); await p.wait_for_timeout(300)
        # IA en copier-coller
        await p.evaluate("GA.ai.openSettings()"); await p.wait_for_timeout(400)
        await p.select_option('#iaP', 'manual'); await p.wait_for_timeout(200)
        await p.click('#iaOk'); await p.wait_for_timeout(400)
        await p.click('#t-ai'); await p.fill('#aiQ', 'compte les calques'); await p.wait_for_timeout(200)
        await p.click('#aiGo'); await p.wait_for_timeout(900)
        await p.fill('#prA', "```python\ndef compter_calques(image):\n    n = len(image.layers)\n    pdb.gimp_message('calques : ' + str(n))\n    return n\n```")
        await p.click('#prGo'); await p.wait_for_timeout(1500)
        R.append('IA vérif: ' + (await p.inner_text('#aiLog .aiMsg.bot .st')).strip())
        await p.click('#aiLog .aiMsg.bot [data-a=insert]'); await p.wait_for_timeout(1500)
        R.append('IA insertion: ' + (await p.inner_text('#aiLog .aiMsg.bot [data-a=insert]')).strip())
        # IA avec code fautif : correction demandée
        bad = await p.evaluate("""GA.aiValidate("def f(img):\\n    print 'x'\\n    pdb.gimp_image_flatten(img, 2)\\n")""")
        R.append('validation fautive: %d erreurs' % len(bad['errors']))
        # tutoriel
        await p.evaluate("GA.tour.start()"); await p.wait_for_timeout(500)
        for _ in range(3): await p.click('#tour .next'); await p.wait_for_timeout(350)
        R.append('tuto étape: ' + await p.inner_text('#tour .n'))
        await p.screenshot(path='/tmp/ui_tour.png')
        await p.click('#tour .skip')
        await p.screenshot(path='/tmp/ui_fr.png')
        print('\n'.join(R)); print('ERREURS FR:', errs[:6])
        await b.close()
        # version anglaise
        b2, p2, errs2 = await mk(pw, 'en')
        await p2.wait_for_timeout(1200)
        out = await p2.evaluate("""() => {
          const cat = [...document.querySelectorAll('.blocklyTreeLabel')].map(e=>e.textContent).slice(0,6);
          const menus = [...document.querySelectorAll('.mbBtn')].map(e=>e.textContent);
          const hat = GA.getHat(GA.ws);
          return { cat, menus, hat: hat ? hat.toString().slice(0,80) : '', dl: document.querySelector('#bDownload').textContent.trim(), tab: document.querySelector('#t-help').textContent.trim() };
        }""")
        print('EN menus:', out['menus']); print('EN catégories:', out['cat']); print('EN bloc départ:', out['hat']); print('EN bouton:', out['dl'], '| onglet:', out['tab'])
        await p2.evaluate("GA.tour.start()"); await p2.wait_for_timeout(400)
        print('EN tuto:', (await p2.inner_text('#tour h3')).strip())
        await p2.click('#tour .skip')
        await p2.click('.mb:nth-child(2) .mbBtn'); await p2.wait_for_timeout(300)
        await p2.screenshot(path='/tmp/ui_en.png')
        print('ERREURS EN:', errs2[:6])
        await b2.close()
asyncio.run(main())
