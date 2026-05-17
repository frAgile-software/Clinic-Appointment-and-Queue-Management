import { jsPDF } from 'jspdf';
import { toCanvas, toPng } from 'html-to-image';

// Source - https://stackoverflow.com/a/53739792
// Posted by Muthukrishnan
// Retrieved 2026-05-17, License - CC BY-SA 4.0

function flattenObject(ob) {
    var toReturn = {};

    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            var flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

export function convertCsv(values, keys = Object.keys(flattenObject(values[0]))) { 
    let csvContent = "data:text/csv;charset=utf-8," + keys.join(",") + "\n";
    csvContent += values.map((v) => {
        const ev = Object.values(flattenObject(v));
        let ret = [];
        for (const k in keys) {
            ret.push(ev[k]);
        }
        // Source - https://stackoverflow.com/a/68146412
        return ret.map(String).map(a => a.replaceAll('"', '""')).map(b => `"${b}"`).join(",");
    }).join("\n"); // This may be doable with less nested things, but I don't know how to ensure that the order of keys is followed otherwise
    return csvContent;
}

export async function convertPdf(element) {
    const canv = await toCanvas(element);
    const doc = new jsPDF({ orientation: canv.width > canv.height ? 'l' : 'p', unit: 'pt', format: [canv.width, canv.height] });
    const png = await toPng(element);

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
