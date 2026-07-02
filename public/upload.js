const API_BASE = "http://localhost:5001";

const form = document.getElementById("uploadForm");
const amountElement = document.getElementById("amount");

const copiesInput =
  document.getElementById("copies");

const colorModeInput =
  document.getElementById("colorMode");

const fileInput =
  document.getElementById("file");

const fileNameElement =
  document.getElementById("fileName");

const totalPagesElement =
  document.getElementById("totalPages");

const printPagesElement =
  document.getElementById("printPages");
  /* =========================
   PDF Preview
========================= */

const pdfCanvas =
  document.getElementById("pdfCanvas");

const pdfContext =
  pdfCanvas.getContext("2d");

let pdfDocument = null;

let currentPage = 1;
const prevPageButton =
  document.getElementById("prevPage");

const nextPageButton =
  document.getElementById("nextPage");

const pageNumber =
  document.getElementById("pageNumber");

const fromPageInput =
  document.getElementById("fromPage");

const toPageInput =
  document.getElementById("toPage");

fileInput.addEventListener(
  "change",
  async () => {
    const file =
  fileInput.files[0];

if (!file) return;

fileNameElement.textContent =
  file.name;

// Show PDF Preview
// Hide both previews first
document.getElementById("pdfCanvas").style.display = "none";
document.getElementById(
"imagePreview"
).style.display = "none";


document.getElementById("thumbnailPanel").innerHTML = "";

// Hide everything first
document.getElementById("pdfCanvas").style.display = "none";
pdfCanvas.width = 0;
pdfCanvas.height = 0;
document.getElementById("imagePreview").style.display = "none";
document.getElementById("imagePreview").src = "";
document.getElementById("filePreviewCard").style.display = "none";
document.getElementById("thumbnailPanel").innerHTML = "";

// PDF
if (file.type === "application/pdf") {

    document.getElementById("pdfCanvas").style.display = "block";

    await renderPDF(file);

}

// Images
else if (file.type.startsWith("image/")) {

    const image =
        document.getElementById("imagePreview");

    image.src =
        URL.createObjectURL(file);

    image.style.display = "block";

    document.getElementById("previewPageCount").textContent =
        "Image Preview";

}

// Other Files (Word, PPT, Excel, etc.)
else {

    const card =
        document.getElementById("filePreviewCard");

    const icon =
        document.getElementById("fileIcon");

    const name =
        document.getElementById("previewFileName");

    const type =
        document.getElementById("previewFileType");

    const extension =
        file.name.split(".").pop().toLowerCase();
    console.log("OTHER FILE");
console.log(file.name);
console.log(file.type);
console.log(extension);

    if (extension === "doc" || extension === "docx") {

        icon.textContent = "📝";
        type.textContent = "Microsoft Word";

    }

    else if (extension === "ppt" || extension === "pptx") {

        icon.textContent = "📊";
        type.textContent = "PowerPoint";

    }

    else if (extension === "xls" || extension === "xlsx") {

        icon.textContent = "📈";
        type.textContent = "Excel Spreadsheet";

    }

    else {

        icon.textContent = "📄";
        type.textContent = "Document";
        console.log("DOCX BLOCK");

    }

    name.textContent = file.name;
    console.log(card);

card.style.visibility = "visible";
card.style.opacity = "1";
card.style.border = "2px solid red";

document.getElementById(
"previewPageCount"
).textContent =
"Calculating pages...";

}

    const data = new FormData();
    data.append("file", file);

    try {
      const response =
        await fetch(`${API_BASE}/api/orders/page-count`,
          {
            method: "POST",
            body: data
          }
        );

      const result =
        await response.json();
        console.log(result);

if (result.success) {

  if(result.previewUrl){

pdfCanvas.style.display = "block";

pdfDocument =
await pdfjsLib.getDocument(
`${API_BASE}${result.previewUrl}`
).promise;

currentPage = 1;

await renderPage(1);

await generateThumbnails();

document.getElementById(
"filePreviewCard"
).style.display = "none";

}

  totalPagesElement.textContent =
    result.pages;

  fromPageInput.max =
    result.pages;

  toPageInput.max =
    result.pages;

  document.getElementById(
    "previewPageCount"
  ).textContent =
    `${result.pages} Pages`;

  calculatePrice();

}



    } catch (e) {
      console.log(e);
    }
  }
);
/* =========================
   Render PDF
========================= */

async function renderPDF(file) {

  const arrayBuffer = await file.arrayBuffer();

  pdfDocument = await pdfjsLib.getDocument({
    data: arrayBuffer
  }).promise;

  currentPage = 1;

  await renderPage(currentPage);

  await generateThumbnails();

}

async function renderPage(pageNumberToRender) {

  if (!pdfDocument) return;

  const page = await pdfDocument.getPage(pageNumberToRender);

  const viewport = page.getViewport({
    scale: 1.2
  });

  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;

  await page.render({
    canvasContext: pdfContext,
    viewport
  }).promise;

  pageNumber.textContent = pageNumberToRender;

  document.getElementById("previewPageCount").textContent =
    `${pdfDocument.numPages} Pages`;

}
/* ===========================
   Generate Thumbnails
=========================== */

async function generateThumbnails() {

    const panel =
        document.getElementById("thumbnailPanel");

    panel.innerHTML = "";

    for (let i = 1; i <= pdfDocument.numPages; i++) {

        const page =
            await pdfDocument.getPage(i);

        const viewport =
            page.getViewport({
                scale: 0.25
            });

        const canvas =
            document.createElement("canvas");

        const context =
            canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport
        }).promise;

        const wrapper =
            document.createElement("div");

        wrapper.className = "thumbnail";

        if (i === 1) {
            wrapper.classList.add("active");
        }

        wrapper.appendChild(canvas);

        wrapper.onclick = async () => {

            currentPage = i;

            document
                .querySelectorAll(".thumbnail")
                .forEach(t => t.classList.remove("active"));

            wrapper.classList.add("active");

            await renderPage(i);

        };

        panel.appendChild(wrapper);

    }

}
function getShopId() {
  return "testshop";
}

function calculatePrice() {
  const copies =
    Number(copiesInput.value) || 1;

  const rate =
    colorModeInput.value === "color"
      ? 10
      : 2;

const totalPages =
  Number(totalPagesElement.textContent) || 1;
console.log("Total Pages =", totalPages);
console.log("From =", fromPageInput.value);
console.log("To =", toPageInput.value);
console.log("Copies =", copiesInput.value);

let from =
  Number(fromPageInput.value) || 1;

let to =
  Number(toPageInput.value) || 1;

if (from < 1) from = 1;

if (to > totalPages)
  to = totalPages;

const selectedPages =
  Math.max(1, to - from + 1);

 printPagesElement.textContent =
  `${from}-${to}`;

  amountElement.textContent =
    selectedPages *
    copies *
    rate;
}

copiesInput.addEventListener(
  "input",
  calculatePrice
);

fromPageInput.addEventListener(
  "input",
  calculatePrice
);

toPageInput.addEventListener(
  "input",
  calculatePrice
);

colorModeInput.addEventListener(
  "change",
  calculatePrice
);

calculatePrice();
/* =========================
   PDF Navigation
========================= */

prevPageButton.addEventListener("click", async () => {

  if (!pdfDocument) return;

  if (currentPage <= 1) return;

  currentPage--;

  await renderPage(currentPage);

});

nextPageButton.addEventListener("click", async () => {

  if (!pdfDocument) return;

  if (currentPage >= pdfDocument.numPages) return;

  currentPage++;

  await renderPage(currentPage);

});
form.addEventListener(
  "submit",
  async (e) => {
    e.preventDefault();

    const status =
      document.getElementById("status");

    status.innerHTML = "Uploading...";

    try {
      const file =
        fileInput.files[0];

      if (!file) {
        status.innerHTML =
          "Please select a file";
        return;
      }

      const data = new FormData();

      data.append("file", file);
console.log(
  "SHOP ID =",
  getShopId()
);

data.append(
  "shopId",
  getShopId()
);

      data.append(
        "customerName",
        document.getElementById(
          "customerName"
        ).value
      );

      data.append(
        "copies",
        copiesInput.value
      );

      data.append(
        "paperSize",
        document.getElementById(
          "paperSize"
        ).value
      );

      data.append(
        "colorMode",
        colorModeInput.value
      );

      data.append(
        "fromPage",
        fromPageInput.value
      );

      data.append(
        "toPage",
        toPageInput.value
      );
      console.log("FROM PAGE:", fromPageInput.value);
console.log("TO PAGE:", toPageInput.value);
console.log("TOTAL PAGES:", totalPagesElement.textContent);

      const orderResponse =
        await fetch(`${API_BASE}/api/orders`,
          {
            method: "POST",
            body: data
          }
        );

      const orderData =
        await orderResponse.json();

      if (!orderData.success) {
        throw new Error(
          orderData.message
        );
      }

totalPagesElement.textContent =
  orderData.totalPages;

fromPageInput.max =
  orderData.totalPages;

toPageInput.max =
  orderData.totalPages;
      printPagesElement.textContent =
        `${fromPageInput.value}-${toPageInput.value}`;

      amountElement.textContent =
        orderData.order.amount;

      const paymentResponse =
        await fetch(`${API_BASE}/api/payments/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              orderId:
                orderData.order.orderId
            })
          }
        );

      const paymentData =
        await paymentResponse.json();

      const razorpay =
        paymentData.razorpayOrder;

      const options = {
        key:
          "rzp_test_T5LqKq5fTNroK0",

        amount:
          razorpay.amount,

        currency:
          "INR",

        order_id:
          razorpay.id,

        name:
          "PrintFlow",

        description:
          "Document Printing",

        handler: async function (response) {

  const verify = await fetch(`${API_BASE}/api/payments/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderId: orderData.order.orderId,
        ...response
      })
    }
  );

  const result = await verify.json();

if (result.success) {
  fromPageInput.value = 1;
toPageInput.value = 1;

  status.innerHTML =
    "✅ Payment Successful. Print Job Queued.";

form.reset();

amountElement.textContent = "0";
totalPagesElement.textContent = "-";
printPagesElement.textContent = "-";

document.getElementById(
"previewPageCount"
).textContent = "-";

document.getElementById(
"filePreviewCard"
).style.display = "none";

document.getElementById(
"pdfCanvas"
).style.display = "none";

document.getElementById(
"imagePreview"
).style.display = "none";

document.getElementById(
"thumbnailPanel"
).innerHTML = "";
pdfDocument = null;

currentPage = 1;

pageNumber.textContent = "1";

fileInput.value = "";
fileNameElement.textContent = "No file selected";

} else {

    status.innerHTML =
      "❌ Payment Verification Failed";

  }

},

        theme: {
          color:
            "#2563eb"
        }
      };

new Razorpay(options).open();

    } catch (error) {
      status.innerHTML =
        error.message ||
        "Something went wrong";
    }
  }
);