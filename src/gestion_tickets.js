/**
 * Ticket Management Logic
 */

let editingCardId = null;

function openManualModal(prefillName = '', prefillPrice = '', editId = null) {
    if (!manualNameInput || !manualPriceInput) return;
    editingCardId = editId;
    manualNameInput.value = prefillName;
    manualPriceInput.value = (prefillPrice && prefillPrice !== '0.00') ? prefillPrice : '';
    manualModal.style.display = 'flex';
    setTimeout(() => (prefillName ? manualPriceInput : manualNameInput).focus(), 100);
    
    const saveBtn = document.getElementById('save-manual-btn');
    if (saveBtn) {
        saveBtn.innerText = editId ? 'Actualizar Ticket' : 'Guardar y Seleccionar';
    }
}

function saveManualTicket() {
    const name = manualNameInput.value.trim();
    const price = manualPriceInput.value.trim();

    if (!name || !price) return showStatus('Completa todos los campos', 'error');

    if (editingCardId) {
        const card = allCards.find(c => c.id === editingCardId);
        if (card) {
            card.name = name.toUpperCase();
            card.price = formatPrice(price);
            selectedIds.add(editingCardId);
        }
        editingCardId = null;
    } else {
        const id = `manual-${nextManualId++}`;
        allCards.unshift({
            id: id,
            name: name.toUpperCase(),
            price: formatPrice(price),
            isManual: true
        });
        selectedIds.add(id);
    }

    manualModal.style.display = 'none';
    if (searchBox) searchBox.disabled = false;
    renderGrid();
}

function toggleSelect(id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    updatePrintBtn();
}

function deleteTicket(id) {
    if (confirm('¿Eliminar este ticket?')) {
        allCards = allCards.filter(c => c.id !== id);
        selectedIds.delete(id);
        renderGrid();
    }
}

function updatePrintBtn() {
    if (!printBtn) return;
    const count = selectedIds.size;
    printBtn.disabled = count === 0;
    printBtn.innerHTML = `<i data-lucide="printer"></i> Imprimir ${count} Seleccionados`;
}

function selectColumn(colIndex) {
    if (allCards.length === 0) return;
    const filter = searchBox.value.trim().toLowerCase();

    let visibleCards = allCards.filter(c => c.name.toLowerCase().includes(filter));
    visibleCards.sort((a, b) => a.name.localeCompare(b.name));

    if (visibleCards.length === 0) return;

    selectedIds.clear();
    visibleCards.forEach((card, index) => {
        const col = (index % 3) + 1;
        if (col === colIndex) {
            selectedIds.add(card.id);
        }
    });

    renderGrid(filter);
    showStatus(`Columna ${colIndex} seleccionada (${selectedIds.size} productos)`, 'success');
}

function renderGrid(filter = '') {
    if (!priceGrid) return;
    const filtered = allCards.filter(c => c.name.toLowerCase().includes(filter));
    priceGrid.innerHTML = '';

    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        priceGrid.style.display = 'none';
        updatePrintBtn();
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    priceGrid.style.display = 'grid';

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    filtered.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `price-card ${card.isManual ? 'manual-highlight' : ''}`;
        cardEl.id = card.id;

        const isSelected = selectedIds.has(card.id);
        const today = new Date().toLocaleDateString('es-ES');

        cardEl.innerHTML = `
            <div class="card-header">
                <input type="checkbox" class="checkbox-custom" ${isSelected ? 'checked' : ''} onchange="toggleSelect('${card.id}')">
            </div>
            <div class="card-content" style="cursor: pointer; flex-grow: 1; display: flex; flex-direction: column;" onclick="editCard('${card.id}')" title="Haz clic para editar precio">
                <div class="card-meta">
                    <div class="card-date">${today}</div>
                    <div class="card-social">${currentFeria ? currentFeria.handle : ''}</div>
                </div>
                <h3 class="card-title">${card.name}</h3>
                <div class="card-price">
                    <span class="currency">Bs</span>
                    <span class="price-value">${card.price}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn" onclick="printSingle('${card.id}')" title="Imprimir solo este"><i data-lucide="printer" style="width: 14px;"></i></button>
                <button class="action-btn delete" onclick="deleteTicket('${card.id}')" title="Eliminar"><i data-lucide="trash-2" style="width: 14px;"></i></button>
            </div>
        `;
        priceGrid.appendChild(cardEl);
    });

    if (window.lucide) lucide.createIcons();
    updatePrintBtn();
}

function handlePrint() {
    const filteredSelected = allCards.filter(c => selectedIds.has(c.id));
    if (filteredSelected.length === 0) return;
    openPrintWindow(filteredSelected);
}

function printSingle(id) {
    const cardData = allCards.find(c => c.id === id);
    if (cardData) {
        openPrintWindow([cardData]);
    }
}

function buildTicketHtml(card, today, feriaHandle) {
    var fontSize = '2.8rem';
    if (card.name.length > 15) fontSize = '2.4rem';
    if (card.name.length > 25) fontSize = '2rem';
    if (card.name.length > 35) fontSize = '1.8rem';

    var h = '';
    h += '<div style="width:100%;color:black;text-align:center;display:table;margin:0;padding:0;border:none;height:80mm;page-break-after:always;">';
    h += '<div style="display:table-cell;vertical-align:middle;text-align:center;padding:3mm 5mm;">';
    h += '<div style="text-align:center;margin-bottom:2mm;">';
    h += '<div style="font-family:Montserrat,sans-serif;font-size:1.1rem;font-weight:700;color:black;line-height:1.3;">' + today + '</div>';
    h += '<div style="font-family:Montserrat,sans-serif;font-size:1.1rem;font-weight:700;color:black;line-height:1.3;">' + feriaHandle + '</div>';
    h += '</div>';
    h += '<div style="font-family:Montserrat,sans-serif;font-size:' + fontSize + ';font-weight:900;color:black;text-align:center;line-height:1.1;text-transform:uppercase;margin-bottom:2mm;">' + card.name + '</div>';
    h += '<div style="text-align:center;">';
    h += '<span style="font-family:Montserrat,sans-serif;font-size:2.5rem;font-weight:900;color:black;vertical-align:baseline;">Bs</span>';
    h += '<span style="font-family:Montserrat,sans-serif;font-size:7.5rem;font-weight:900;color:black;line-height:0.9;"> ' + card.price + '</span>';
    h += '</div>';
    h += '<div style="font-family:Montserrat,sans-serif;font-size:1.15rem;font-weight:700;color:black;font-style:italic;text-align:center;margin-top:2mm;">¡Gracias por tu visita! Que tengas un excelente día.</div>';
    h += '</div>';
    h += '</div>';
    return h;
}

function openPrintWindow(cardsToPrint) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Por favor, permite los pop-ups para imprimir.');
        return;
    }

    const today = new Date().toLocaleDateString('es-ES');
    const feriaHandle = currentFeria ? currentFeria.handle : '';

    let ticketsHtml = '';
    cardsToPrint.forEach(function (card) {
        ticketsHtml += buildTicketHtml(card, today, feriaHandle);
    });

    var html = '<!DOCTYPE html><html><head><title>Imprimir Tickets</title>';
    html += '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap">';
    html += '<style>';
    html += '@page { size: 210mm 80mm; margin: 0 !important; }';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    html += 'body { background: white; width: 100%; margin: 0; padding: 0; }';
    html += '</style>';
    html += '</head><body>';
    html += ticketsHtml;
    html += '<script>window.onload=function(){setTimeout(function(){window.print(); window.close();}, 500)};<\/script>';
    html += '</body></html>';

    printWindow.document.write(html);
    printWindow.document.close();
}

// Global exposure for HTML onclick attributes
window.toggleSelect = toggleSelect;
window.deleteTicket = deleteTicket;
window.printSingle = printSingle;
window.handlePrint = handlePrint;
window.selectColumn = selectColumn;
window.saveManualTicket = saveManualTicket;
window.editCard = function(id) {
    const cardData = allCards.find(c => c.id === id);
    if (!cardData) return;
    openManualModal(cardData.name, cardData.price, cardData.id);
};
