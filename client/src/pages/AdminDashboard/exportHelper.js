import { jsPDF } from 'jspdf';
import { toCanvas, toPng } from 'html-to-image';

export function convertCsv(values, keys = Object.keys(values[0])) { // why and how does Javascript let you do this for a default value
    let csvContent = "data:text/csv;charset=utf-8," + keys.join(",") + "\n";
    csvContent += values.map((v) => {
        const ev = Object.values(v);
        let ret = [];
        for (const k in keys) {
            ret.push(ev[k]);
        }
        // Source - https://stackoverflow.com/a/68146412
        return ret.map(String).map(a => a.replaceAll('"', '""')).map(b => `"${b}"`).join(",");
    }).join("\n"); // This may be doable with less nested things, but I don't know how to ensure that the order of keys is followed otherwise
    return csvContent;
}

const print_filter = (node) => !node.classList?.contains('pdf-print-ignore');
export async function convertPdf(element) {
    const canv = await toCanvas(element, {filter: print_filter});
    const doc = new jsPDF({ orientation: canv.width > canv.height ? 'l' : 'p', unit: 'pt', format: [canv.width, canv.height] });
    const png = await toPng(element, {filter: print_filter});

    doc.addImage(png, "PNG", 0, 0, canv.width, canv.height);
    return doc.output("datauristring");
}

export function downloadFile(fileContent, fileName) {
    const content = encodeURI(fileContent);
    const link = document.createElement("a");
    link.setAttribute("download", fileName);
    link.setAttribute("href", content);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
