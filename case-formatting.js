// Format section labels without changing the clinical text or pasted markup.
function formatClinicalHeadings(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  const lines = [];
  let parts = [];
  const boundary = () => {
    if (parts.length) lines.push(parts);
    parts = [];
  };
  const blocks = /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DIV|DL|DT|DD|FIGCAPTION|FIGURE|FOOTER|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TR|TD|TH|UL)$/;
  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const pattern = /[^\r\n]+|\r\n|[\r\n]/g;
      for (const match of node.data.matchAll(pattern)) {
        if (/^[\r\n]/.test(match[0])) boundary();
        else parts.push({ node, offset: match.index, text: match[0] });
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (/^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(node.tagName)) { boundary(); return; }
    if (node.tagName === 'BR') { boundary(); return; }
    const block = blocks.test(node.tagName);
    if (block) boundary();
    Array.from(node.childNodes).forEach(visit);
    if (block) boundary();
  }
  visit(root);
  boundary();

  // Labels must start a line and end with a colon or occupy the whole line.
  // Match across inline spans, which are common when pasting clinical notes.
  const heading = /^(\s*)((?:History\s+of\s+presenting\s+complaints?|Allergies|Medical\s+History|Current\s+medications|On\s+examination|Investigations?|Assessment|Management(?:\s+Plan)?)(?:\s*:|(?=\s*$)))/i;
  const changes = [];
  for (const line of lines) {
    const match = line.map(part => part.text).join('').match(heading);
    if (!match) continue;
    const start = match[1].length;
    const end = start + match[2].length;
    let position = 0;
    for (const part of line) {
      const from = Math.max(start - position, 0);
      const to = Math.min(end - position, part.text.length);
      if (from < to && !part.node.parentElement.closest('strong, b')) {
        changes.push({ node: part.node, from: part.offset + from, to: part.offset + to });
      }
      position += part.text.length;
    }
  }
  // Work backwards so offsets stay valid for multiple lines in a text node.
  for (const { node, from, to } of changes.reverse()) {
    if (to < node.length) node.splitText(to);
    const label = from ? node.splitText(from) : node;
    const strong = document.createElement('strong');
    label.replaceWith(strong);
    strong.appendChild(label);
  }
  return root.innerHTML;
}
