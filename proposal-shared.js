// =====================================================
//  FINANCIAL PROPOSAL — SHARED LOGIC
//  Used by script.js (admin) and proposal.js (client page)
// =====================================================

export function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function formatMoney(amount, currency) {
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('en-US');
    return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency || 'EGP'}`;
}

// Human-readable recurrence label (Arabic, layman-friendly)
export function recurrenceLabel(item) {
    switch (item.recurrence) {
        case 'monthly': return 'يتجدد كل شهر';
        case 'yearly':  return 'يتجدد كل سنة';
        case 'custom':  return item.recurrenceNote?.trim() || 'يتجدد بشكل دوري';
        case 'once':
        default:        return 'دفعة واحدة';
    }
}

// Is this item currently included in the total?
// Base items are always included. Optional items depend on the selections map.
export function isItemIncluded(item, selections) {
    if (item.tier === 'base') return true;
    return !!(selections && selections[item.id]);
}

export function calcTotal(proposal, selections) {
    const items = proposal.items || [];
    return items.reduce((sum, item) => {
        return isItemIncluded(item, selections) ? sum + (Number(item.price) || 0) : sum;
    }, 0);
}

export function groupItemsByCategory(proposal) {
    const categories = proposal.categories || [];
    const items = proposal.items || [];
    return categories.map(cat => ({
        ...cat,
        items: items.filter(it => it.categoryId === cat.id)
    })).filter(cat => cat.items.length > 0);
}

// Renders the full proposal as an HTML string.
// interactive: true  -> real checkboxes the client can click (used on the live client page)
// interactive: false -> static checkmarks (used for the PDF snapshot / admin preview)
export function renderProposalHTML(proposal, selections, { interactive = false, locked = false } = {}) {
    const currency = proposal.currency || 'EGP';
    const groups = groupItemsByCategory(proposal);
    const total = calcTotal(proposal, selections);

    const groupsHtml = groups.map(group => `
        <div style="margin-bottom:22px;">
            <h3 style="font-family:'Orbitron',sans-serif;font-size:14px;letter-spacing:1px;color:#00f15e;text-transform:uppercase;margin-bottom:10px;">${escapeHtml(group.name)}</h3>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${group.items.map(item => renderItemRow(item, selections, currency, { interactive, locked })).join('')}
            </div>
        </div>
    `).join('');

    return `
        <div style="font-family:'Plus Jakarta Sans',sans-serif;color:#e5e7eb;">
            ${groupsHtml}
            <div style="border-top:1px solid rgba(255,255,255,0.12);margin-top:18px;padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:13px;opacity:0.6;font-family:'JetBrains Mono',monospace;">TOTAL</span>
                <span id="proposal-total-display" style="font-size:26px;font-weight:900;color:#00f15e;font-family:'Orbitron',sans-serif;">${formatMoney(total, currency)}</span>
            </div>
            ${proposal.notes ? `<p style="margin-top:16px;font-size:12px;opacity:0.5;line-height:1.6;">${escapeHtml(proposal.notes)}</p>` : ''}
        </div>
    `;
}

function renderItemRow(item, selections, currency, { interactive, locked }) {
    const included = isItemIncluded(item, selections);
    const isBase = item.tier === 'base';
    const disabled = !interactive || locked || isBase;

    const control = isBase
        ? `<span style="width:18px;height:18px;border-radius:5px;background:#00f15e;display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:#000;flex-shrink:0;">✓</span>`
        : `<input type="checkbox" class="proposal-item-checkbox" data-item-id="${item.id}" ${included ? 'checked' : ''} ${disabled ? 'disabled' : ''} style="width:18px;height:18px;flex-shrink:0;accent-color:#00f15e;">`;

    return `
        <label style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);opacity:${included ? '1' : '0.5'};cursor:${disabled ? 'default' : 'pointer'};">
            ${control}
            <span style="flex-grow:1;">
                <span style="display:block;font-size:14px;font-weight:600;">${escapeHtml(item.name)}</span>
                ${item.description ? `<span style="display:block;font-size:12px;opacity:0.7;margin-top:4px;line-height:1.5;">${escapeHtml(item.description)}</span>` : ''}
                <span style="display:block;font-size:11px;opacity:0.4;font-family:'JetBrains Mono',monospace;margin-top:4px;">${escapeHtml(recurrenceLabel(item))}${isBase ? ' · أساسي' : ''}</span>
            </span>
            <span style="flex-shrink:0;font-weight:700;font-size:14px;font-family:'JetBrains Mono',monospace;">${formatMoney(item.price, currency)}</span>
        </label>
    `;
}

export async function downloadNodeAsPDF(node, filename) {
    const canvas = await window.html2canvas(node, { backgroundColor: '#0a0a0a', scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdfWidth = canvas.width / 2;
    const pdfHeight = canvas.height / 2;
    const pdf = new jsPDF({ orientation: pdfHeight > pdfWidth ? 'p' : 'l', unit: 'pt', format: [pdfWidth, pdfHeight] });
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename || 'proposal.pdf');
}

export function buildPdfContainer(proposal, selections) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-99999px';
    container.style.top = '0';
    container.style.width = '760px';
    container.style.background = '#0a0a0a';
    container.style.padding = '40px';
    container.style.border = '1px solid #1f2937';

    const total = calcTotal(proposal, selections);
    container.innerHTML = `
        <div style="font-family:'Plus Jakarta Sans',sans-serif;">
            <p style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;color:#00f15e;margin-bottom:6px;">FINANCIAL PROPOSAL</p>
            <h1 style="font-family:'Orbitron',sans-serif;font-size:26px;color:#fff;font-weight:900;margin-bottom:4px;">${escapeHtml(proposal.projectTitle || '')}</h1>
            <p style="font-size:13px;color:#9ca3af;margin-bottom:24px;">Prepared for: ${escapeHtml(proposal.clientName || '')}</p>
            ${renderProposalHTML(proposal, selections, { interactive: false, locked: true })}
        </div>
    `;
    document.body.appendChild(container);
    return container;
}

export async function generateProposalPDF(proposal, selections) {
    const container = buildPdfContainer(proposal, selections);
    const safeClient = (proposal.clientName || 'client').replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-');
    await downloadNodeAsPDF(container, `proposal-${safeClient}.pdf`);
    document.body.removeChild(container);
}