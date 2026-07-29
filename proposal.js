import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js";
import { getFirestore, doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { escapeHtml, formatMoney, recurrenceLabel, calcTotal, groupItemsByCategory, isItemIncluded, generateProposalPDF } from "./proposal-shared.js";

const firebaseConfig = {
    apiKey: "AIzaSyC9c5yk7Smmjk3PRJgJm24PmXJfr0XpBlc",
    authDomain: "robert-portfolio-98d71.firebaseapp.com",
    projectId: "robert-portfolio-98d71",
    storageBucket: "robert-portfolio-98d71.firebasestorage.app",
    messagingSenderId: "125447409289",
    appId: "1:125447409289:web:010585084cc2a0fe8ec058",
    measurementId: "G-FS62VLHDGH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LcsLsArAAAAAIKuIslOZOQSSr7HSlZZD2qVHWhD'),
    isTokenAutoRefreshEnabled: true
});

const params = new URLSearchParams(location.search);
const proposalId = params.get('id');

const $ = (id) => document.getElementById(id);
function showState(name) {
    ['loading-state', 'not-found-state', 'locked-state', 'proposal-view'].forEach(id => {
        $(id).classList.toggle('hidden', id !== name);
    });
}

if (!proposalId) {
    showState('not-found-state');
} else {
    let previousStatus = null;
    let saveTimer = null;

    onSnapshot(doc(db, 'proposals', proposalId), async (snap) => {
        if (!snap.exists()) { showState('not-found-state'); return; }
        const proposal = snap.data();

        if (previousStatus === 'open' && proposal.status === 'locked') {
            try { await generateProposalPDF(proposal, proposal.selections || {}); }
            catch (err) { console.error('PDF generation failed:', err); }
        }
        previousStatus = proposal.status;

        if (proposal.status === 'locked') {
            showState('locked-state');
            return;
        }

        renderProposal(proposal);
        showState('proposal-view');
        if (window.feather) feather.replace();
    }, (err) => {
        console.error(err);
        showState('not-found-state');
    });

    function renderProposal(proposal) {
        const selections = { ...(proposal.selections || {}) };
        $('p-title').textContent = proposal.projectTitle || '';
        $('p-client').textContent = proposal.clientName ? `Prepared for: ${proposal.clientName}` : '';

        if (proposal.notes) {
            $('p-notes').textContent = proposal.notes;
            $('p-notes').classList.remove('hidden');
        }

        const currency = proposal.currency || 'EGP';
        const groups = groupItemsByCategory(proposal);
        $('p-groups').innerHTML = groups.map(group => `
            <div>
                <h3 class="font-display text-xs tracking-[2px] accent uppercase mb-3">${escapeHtml(group.name)}</h3>
                <div class="space-y-2">
                    ${group.items.map(item => itemRowHtml(item, selections, currency)).join('')}
                </div>
            </div>
        `).join('');

        updateTotalDisplay(proposal, selections);

        $('p-groups').querySelectorAll('.item-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                const isBase = cb.dataset.tier === 'base';
                if (isBase) {
                    cb.checked = true;
                    return; 
                }

                selections[cb.dataset.itemId] = cb.checked;
                cb.closest('.item-row').classList.toggle('excluded', !cb.checked);
                updateTotalDisplay(proposal, selections);
                queueSave(selections);
            });
        });
    }

    function itemRowHtml(item, selections, currency) {
        const isBase = item.tier === 'base';
        const included = isBase || isItemIncluded(item, selections);
        
        return `
            <label class="item-row ${included ? '' : 'excluded'} ${isBase ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}">
                ${isBase
                    ? `<span class="base-chip" title="عنصر أساسي لا يمكن إزالته">✓</span>
                       <input type="checkbox" class="hidden item-checkbox" data-item-id="${item.id}" data-tier="base" checked disabled>`
                    : `<input type="checkbox" class="item-checkbox" data-item-id="${item.id}" data-tier="optional" ${included ? 'checked' : ''}>`}
                <span class="flex-grow">
                    <span class="block text-sm font-semibold">${escapeHtml(item.name)}</span>
                    ${item.description ? `<span class="block text-xs opacity-70 mt-1 leading-relaxed">${escapeHtml(item.description)}</span>` : ''}
                    <span class="block text-xs opacity-40 font-mono mt-1">${escapeHtml(recurrenceLabel(item))}${isBase ? ' · أساسي' : ''}</span>
                </span>
                <span class="flex-shrink-0 font-bold text-sm font-mono">${formatMoney(item.price, currency)}</span>
            </label>
        `;
    }

    function updateTotalDisplay(proposal, selections) {
        $('p-total').textContent = formatMoney(calcTotal(proposal, selections), proposal.currency);
    }

    function queueSave(selections) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
            try { await updateDoc(doc(db, 'proposals', proposalId), { selections }); }
            catch (err) { console.error('Autosave failed:', err); }
        }, 500);
    }
}