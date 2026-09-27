import asyncio, pathlib, json
from playwright.async_api import async_playwright
HTML = pathlib.Path('/home/claude/repo/gimp-code-block/dist/gimp-code-block.html').read_text()
BL = '/home/claude/node_modules/blockly/'
CODE = "```python\ndef compter(image):\n    n = len(image.layers)\n    pdb.gimp_message(str(n))\n    return n\n```"
seen = []
async def route(r):
    u = r.request.url
    if u.startswith('https://x.test/'):
        await r.fulfill(status=200, content_type='text/html; charset=utf-8', body=HTML); return
    if 'jsdelivr' in u:
        f = BL + u.split('blockly@10.4.3/')[1]
        try: await r.fulfill(status=200, content_type='application/javascript', body=pathlib.Path(f).read_text())
        except Exception: await r.fulfill(status=404, body='')
        return
    if 'faux-serveur' in u:
        req = r.request
        seen.append({'url': u, 'headers': {k: v for k, v in req.headers.items() if k.lower() in ('authorization','x-api-key','x-ma-cle','x-org')}, 'body': json.loads(req.post_data or '{}')})
        if '/api/chat' in u:      # Ollama natif
            await r.fulfill(status=200, content_type='application/json', body=json.dumps({'message': {'role': 'assistant', 'content': CODE}}))
        elif '/maison' in u:      # API maison, forme inhabituelle
            await r.fulfill(status=200, content_type='application/json', body=json.dumps({'data': {'sortie': [{'texte': CODE}]}}))
        else:
            await r.fulfill(status=200, content_type='application/json', body=json.dumps({'choices': [{'message': {'content': CODE}}]}))
        return
    await r.continue_()
async def setup(p, **kw):
    await p.evaluate("GA.ai.openSettings()"); await p.wait_for_timeout(300)
    await p.select_option('#iaP', 'custom'); await p.wait_for_timeout(200)
    for sel, val in kw.items():
        s = '#' + sel
        if sel in ('iaD', 'iaAuth'): await p.select_option(s, val)
        else: await p.fill(s, val)
        await p.wait_for_timeout(120)
    await p.click('#iaOk'); await p.wait_for_timeout(300)
async def ask(p, q):
    await p.click('#t-ai'); await p.fill('#aiQ', q); await p.click('#aiGo')
    await p.wait_for_timeout(1800)
    return (await p.inner_text('#aiLog .aiMsg.bot .st')).strip()
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args=['--no-sandbox'])
        p = await (await b.new_context(viewport={'width':1500,'height':950})).new_page()
        errs=[]; p.on('pageerror', lambda e: errs.append(str(e)))
        await p.route('**/*', route)
        await p.add_init_script("localStorage.setItem('atelier-gimp-lang','fr')")
        await p.goto('https://x.test/a.html'); await p.wait_for_selector('#blockly .blocklyWorkspace', timeout=45000); await p.wait_for_timeout(1200)
        await p.evaluate("document.querySelector('#overlay.open .foot .primary')?.click()")

        # 1. Ollama natif, sans aucune clé
        await setup(p, iaU='https://faux-serveur.test', iaD='ollama', iaAuth='none', iaM='qwen2.5-coder:7b')
        print('1. Ollama natif, sans clé :', await ask(p, 'compte les calques'))
        print('   requête →', seen[-1]['url'], '| clés envoyées :', seen[-1]['headers'], '| champs :', list(seen[-1]['body'].keys()))

        # 2. API maison : chemin, corps et chemin de réponse écrits à la main, en-tête exotique
        await setup(p, iaU='https://faux-serveur.test', iaD='openai', iaAuth='header', iaAuthName='X-Ma-Cle', iaAuthPre='', iaK='SECRET42',
                    iaPath='/maison/generer', iaH='{"X-Org": "moi"}',
                    iaB='{"modele": "{{model}}", "invite": "{{prompt}}", "consigne": "{{system}}", "chaleur": {{temperature}}}',
                    iaRp='data.sortie.0.texte', iaM='mon-modele-perso')
        print('2. API maison + en-tête perso :', await ask(p, 'compte les calques'))
        print('   requête →', seen[-1]['url'], '| clés envoyées :', seen[-1]['headers'], '| champs :', list(seen[-1]['body'].keys()))

        # 3. Serveur compatible OpenAI, réponse sans chemin indiqué (détection auto)
        await setup(p, iaU='https://faux-serveur.test/v1', iaD='openai', iaAuth='bearer', iaK='sk-test', iaPath='/chat/completions', iaB='', iaRp='', iaH='')
        print('3. Compatible OpenAI, détection auto :', await ask(p, 'compte les calques'))
        print('   requête →', seen[-1]['url'], '| clés envoyées :', seen[-1]['headers'])
        await p.click('#aiLog .aiMsg.bot [data-a=insert]'); await p.wait_for_timeout(1200)
        print('   insertion :', (await p.inner_text('#aiLog .aiMsg.bot [data-a=insert]')).strip())
        print('ERREURS :', errs[:4])
        await b.close()
asyncio.run(main())
