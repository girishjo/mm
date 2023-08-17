function toObject(table) {
    const result = []
    for (let i = 0; i < table.tBodies[0].rows.length; i++) {
        const row = table.tBodies[0].rows[i];
        if (!row.classList.contains('hide')) {
            const res = [];
            for (let j = 0; j < row.cells.length; j++) {
                const cell = row.cells[j];
                cell.classList.contains('text') && res.push(cell.textContent);
            }
            res.length > 0 && result.push(res);
        }
    }
    return result;
}