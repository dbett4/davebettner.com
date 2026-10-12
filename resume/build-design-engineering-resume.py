"""Build editable Word résumés and export matching PDFs with native LibreOffice."""
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess
import zipfile
import io
import shutil
import lxml.etree as ET

ROOT = Path(__file__).resolve().parent
assert subprocess.check_output(['fc-match', '--format', '%{family}', 'Manrope'], text=True) == 'Manrope', 'Install the bundled Manrope font before native export.'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ET.register_namespace('w', W)
def tag(name):
    return '{' + W + '}' + name

def child(parent, name, **attrs):
    item = parent.find(tag(name))
    if item is None:
        item = ET.SubElement(parent, tag(name))
    for key, value in attrs.items():
        item.set(tag(key), str(value))
    return item

default = subprocess.check_output(['pandoc', '--print-default-data-file', 'reference.docx'])
with zipfile.ZipFile(io.BytesIO(default)) as base:
    files = {name: base.read(name) for name in base.namelist()}
styles = ET.fromstring(files['word/styles.xml'])
defaults = child(styles, 'docDefaults')
run = child(child(defaults, 'rPrDefault'), 'rPr')
child(run, 'rFonts', ascii='Manrope', hAnsi='Manrope', cs='Manrope')
child(run, 'sz', val=21)
child(run, 'color', val='202020')
para = child(child(defaults, 'pPrDefault'), 'pPr')
child(para, 'spacing', before=0, after=80, line=265, lineRule='auto')
for style in styles.findall(tag('style')):
    name = style.get(tag('styleId'))
    if name in ['Normal', 'BodyText', 'FirstParagraph', 'Compact']:
        r = child(style, 'rPr')
        fonts = child(r, 'rFonts', ascii='Manrope', hAnsi='Manrope', cs='Manrope')
        for attribute in list(fonts.attrib):
            if attribute.endswith('Theme'):
                del fonts.attrib[attribute]
        child(r, 'sz', val=21)
        child(child(style, 'pPr'), 'spacing', before=0, after=75, line=265, lineRule='auto')
    if name in ['Heading1', 'Heading2', 'Heading3']:
        r = child(style, 'rPr')
        child(r, 'color', val='181818')
        fonts = child(r, 'rFonts', ascii='Manrope', hAnsi='Manrope')
        for attribute in list(fonts.attrib):
            if attribute.endswith('Theme'):
                del fonts.attrib[attribute]
        child(r, 'b')
        child(r, 'sz', val={'Heading1': 48, 'Heading2': 24, 'Heading3': 22}[name])
        p = child(style, 'pPr')
        child(p, 'keepNext')
        child(p, 'spacing', before={'Heading1': 0, 'Heading2': 200, 'Heading3': 120}[name], after=70)
    if name == 'Hyperlink':
        child(child(style, 'rPr'), 'color', val='202A35')
files['word/styles.xml'] = ET.tostring(styles, encoding='utf-8', xml_declaration=True)
document = ET.fromstring(files['word/document.xml'])
section = document.find('.//' + tag('sectPr'))
child(section, 'pgSz', w=12240, h=15840)
child(section, 'pgMar', top=820, right=864, bottom=820, left=864, header=0, footer=0, gutter=0)
files['word/document.xml'] = ET.tostring(document, encoding='utf-8', xml_declaration=True)

with TemporaryDirectory(prefix='newdave-design-resume-') as directory:
    temp = Path(directory)
    reference = temp / 'reference.docx'
    with zipfile.ZipFile(reference, 'w', zipfile.ZIP_DEFLATED) as out:
        for name, content in files.items():
            out.writestr(name, content)
    filter_path = temp / 'resume-pages.lua'
    filter_path.write_text('''
function Header(el)
  if el.level == 2 and pandoc.utils.stringify(el.content) == "Experience" then
    return {pandoc.RawBlock("openxml", '<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>'), el}
  end
end
''')
    stems = ['dave-bettner-design-engineering']
    for stem in stems:
        docx = ROOT / (stem + '.docx')
        subprocess.run(['pandoc', str(ROOT / (stem + '.md')), '--reference-doc', str(reference), '--lua-filter', str(filter_path), '-o', str(docx)], check=True)
    profile = (temp / 'libreoffice-profile').as_uri()
    export = temp / 'export'
    export.mkdir()
    result = subprocess.run(['libreoffice', '-env:UserInstallation=' + profile, '--headless', '--convert-to', 'pdf', '--outdir', str(export), *[str(ROOT / (stem + '.docx')) for stem in stems]], capture_output=True, text=True, check=True, timeout=60)
    print(result.stdout)
    if 'Error:' in result.stdout + result.stderr:
        raise RuntimeError('Native export rejected a source: ' + result.stdout + result.stderr)
    for stem in stems:
        fresh = export / (stem + '.pdf')
        assert fresh.is_file() and fresh.read_bytes().startswith(b'%PDF-'), 'Missing fresh native export: ' + stem
    for stem in stems:
        target = ROOT / (stem + '.pdf')
        staging = ROOT / (stem + '.pdf.new')
        shutil.copyfile(export / (stem + '.pdf'), staging)
        staging.replace(target)
    for stem in stems:
        assert (ROOT / (stem + '.pdf')).is_file()
        print('Built', stem + '.docx', 'and', stem + '.pdf')
