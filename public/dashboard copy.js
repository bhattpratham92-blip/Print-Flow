
const API_BASE = "";

const SHOP_ID = "testshop";

const TOKEN =
  localStorage.getItem("token") || "";
  let allOrders = [];
  let revenueChart = null;
  let statusChart = null;
  function animateValue(

id,

end,

prefix=""

){

const element =

document.getElementById(id);

if(!element)return;

let start = 0;

const duration = 800;

const increment =

end/50;

const timer = setInterval(()=>{

start += increment;

if(start>=end){

start=end;

clearInterval(timer);

}

element.textContent =

prefix +

Math.round(start);

},duration/50);

}

async function fetchDashboard() {

  try {

    const response = await fetch(
      `${API_BASE}/api/shops/${SHOP_ID}/dashboard`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (!data.success) return;

    animateValue(
      "totalOrders",
      data.totalOrders || 0
    );

    animateValue(
      "revenue",
      data.revenue || 0,
      "₹"
    );

  }

  catch (error) {

    console.error(
      "Dashboard Error:",
      error
    );

  }

}



async function fetchQueue() {

  try {

    const response = await fetch(

      `${API_BASE}/api/orders/shop/${SHOP_ID}/history`,

      {

        headers: {

          Authorization: `Bearer ${TOKEN}`

        }

      }

    );

    const data =
      await response.json();

    if (!data.success) return;

    animateValue(

      "pendingOrders",

      data.orders.filter(

        o => o.status !== "printed"

      ).length

    );

    allOrders =
      data.orders;

    renderOrders(
      allOrders
    );

  }

  catch (error) {

    console.error(
      error
    );

  }

}



function renderOrders(orders){

const table =
document.getElementById(
"ordersTable"
);

table.innerHTML = "";

let printedCount = 0;

let totalPages = 0;

let revenue = 0;

let todayOrders = 0;

orders.forEach(order=>{

totalPages +=
order.selectedPages || 0;

revenue +=
order.amount || 0;

const createdDate =

order.createdAt?._seconds

?

new Date(

order.createdAt._seconds*1000

)

:

null;

if(

createdDate &&

createdDate.toDateString()

===

new Date().toDateString()

){

todayOrders++;

}

if(

order.status==="printed"

){

printedCount++;

}

const created =

createdDate

?

createdDate.toLocaleString()

:

"-";

const previewButton =

order.storagePath

?

`<button onclick="previewOrder('${order.orderId}')">

Preview

</button>`

:

"";

const row =

document.createElement(

"tr"

);

row.innerHTML = `

<td>${order.orderId}</td>

<td>${order.customerName || "Guest"}</td>

<td>${order.selectedPages || 0}</td>

<td>₹${order.amount || 0}</td>

<td>${order.copies || 1}</td>

<td>${order.colorMode || "bw"}</td>

<td>${created}</td>

<td>

<span class="badge ${order.status}">

${order.status}

</span>

</td>

<td>

${previewButton}

<button

class="reprint-btn"

onclick="reprintOrder('${order.orderId}')">

Reprint

</button>

<button

class="delete-btn"

onclick="deleteOrder('${order.orderId}')">

Delete

</button>

</td>

`;

table.appendChild(

row

);

});

animateValue(

"printedOrders",

printedCount

);

animateValue(

"pagesPrinted",

totalPages

);

animateValue(

"todayOrders",

todayOrders

);

animateValue(

"avgOrder",

orders.length

?

Math.round(

revenue /

orders.length

)

:

0,

"₹"

);

updateRevenueChart(

orders

);

updateStatusChart(

orders

);

}



const searchBtn =

document.getElementById(

"searchBtn"

);

const searchBox =

document.getElementById(

"searchBox"

);

if(searchBtn){

searchBtn.addEventListener(

"click",

searchOrders

);

}

if(searchBox){

searchBox.addEventListener(

"input",

searchOrders

);

}



function searchOrders(){

const term =

searchBox.value

.toLowerCase()

.trim();

if(

term===""

){

renderOrders(

allOrders

);

return;

}

const filtered =

allOrders.filter(

o =>

(o.customerName || "")

.toLowerCase()

.includes(term)

||

(o.orderId || "")

.toLowerCase()

.includes(term)

);

renderOrders(

filtered

);

}



async function markPrinted(orderId){

try{

await fetch(

`${API_BASE}/api/orders/${orderId}/printed`,

{

method:"PATCH",

headers:{

Authorization:

`Bearer ${TOKEN}`

}

}

);

fetchDashboard();

fetchQueue();

}

catch(error){

console.error(

"Print Error:",

error

);

}

}



function updateRevenueChart(orders){

const days=[
"Mon",
"Tue",
"Wed",
"Thu",
"Fri",
"Sat",
"Sun"
];

const revenueData=[
0,0,0,0,0,0,0
];

orders.forEach(order=>{

if(!order.createdAt?._seconds) return;

const d =
new Date(
order.createdAt._seconds*1000
);

const index =
(d.getDay()+6)%7;

revenueData[index]+=
order.amount||0;

});

if(revenueChart){

revenueChart.destroy();

}

const canvas=
document.getElementById(
"revenueChart"
);

if(!canvas)return;

revenueChart =
new Chart(

canvas,

{

type:"line",

data:{

labels:days,

datasets:[{

label:"Revenue",

data:revenueData,

borderColor:"#60a5fa",

backgroundColor:
"rgba(96,165,250,.15)",

fill:true,

tension:0.4

}]

},

options:{

responsive:true,

plugins:{

legend:{

labels:{

color:"#fff"

}

}

},

scales:{

x:{

ticks:{

color:"#94a3b8"

}

},

y:{

ticks:{

color:"#94a3b8"

}

}

}

}

}

);

}


function updateStatusChart(orders){

const printed =

orders.filter(

o=>o.status==="printed"

).length;

const pending =

orders.filter(

o=>o.status==="pending"

).length;

const printing =

orders.filter(

o=>o.status==="printing"

).length;

if(statusChart){

statusChart.destroy();

}

const canvas =

document.getElementById(

"statusChart"

);

if(!canvas)return;

statusChart =

new Chart(

canvas,

{

type:"doughnut",

data:{

labels:[

"Printed",

"Pending",

"Printing"

],

datasets:[{

data:[

printed,

pending,

printing

],

backgroundColor:[

"#22c55e",

"#eab308",

"#3b82f6"

],

borderWidth:0

}]

},

options:{

responsive:true,

plugins:{

legend:{

labels:{

color:"#ffffff"

}

}

}

}

}

);

}
async function deleteOrder(

orderId

){

if(

!confirm(

"Delete order?"

)

){

return;

}

await fetch(

`${API_BASE}/api/orders/${orderId}`,

{

method:"DELETE"

}

);

fetchQueue();

}


async function reprintOrder(orderId){

await fetch(

`${API_BASE}/api/orders/${orderId}/status`,

{

method:"PATCH",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

status:"queued"

})

}

);

fetchQueue();

}

function previewOrder(

id

){

window.open(

`${API_BASE}/api/orders/files/${id}`,

"_blank"

);

}

const refreshBtn =
document.getElementById("refreshBtn");

if(refreshBtn){

refreshBtn.addEventListener(

"click",

()=>{

fetchDashboard();

fetchQueue();

}

);

}

fetchDashboard();
fetchQueue();

setInterval(() => {
  fetchDashboard();
  fetchQueue();
}, 15000);

const clearBtn =

document.getElementById(

"clearHistoryBtn"

);

if(clearBtn){

clearBtn.addEventListener(

"click",

async()=>{

if(

!confirm(

"Clear all history?"

)

){

return;

}

await fetch(

`${API_BASE}/api/orders/shop/${SHOP_ID}/history`,

{

method:"DELETE"

}

);

fetchQueue();

}

);

}
