/* renommage d'une variable dans du code Python : textes, commentaires, attributs et arguments nommés intacts */
'use strict';
global.GA = {};
require('../src/pyvars.js');
var GA = global.GA, bad = 0;
function eq(code, want) {
  var got = GA.renameInCode(code, 'image', 'img');
  if (got === want) console.log('✔ ' + code); else { bad++; console.log('✘ ' + code + '\n   → ' + got + '\n   attendu ' + want); }
}
eq('image', 'img');
eq('pdb.gimp_image_undo_group_start(image)', 'pdb.gimp_image_undo_group_start(img)');
eq('image.width + x.image', 'img.width + x.image');
eq('"image" + \'image\' + image', '"image" + \'image\' + img');
eq('f(image=image)', 'f(image=img)');
eq('image == 1', 'img == 1');
eq('image, drawable  # image active', 'img, drawable  # image active');
eq('u"""image""" if image else None', 'u"""image""" if img else None');
eq('images + my_image + image2', 'images + my_image + image2');
eq('image=None, drawable=None', 'img=None, drawable=None');
eq('[i.image for image in gimp.image_list()]', '[i.image for img in gimp.image_list()]');
if (!GA.isPyIdent('mon_calque') || GA.isPyIdent('2x') || GA.isPyIdent('for') || GA.isPyIdent('é')) { bad++; console.log('✘ isPyIdent'); }
console.log(bad ? '\n' + bad + ' ÉCHEC(S)' : '\nTOUT OK');
process.exit(bad ? 1 : 0);
