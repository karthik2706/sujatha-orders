//Mantra Fashion Jewellery
const firebaseConfig = window.firebaseConfig;

//API keys variables
var clientKeyD;
var urlD;
var clientName;

firebase.initializeApp(firebaseConfig);

const clientRef = "-M_M99xUv7WD4c-I2-0z";

const profileRef = "-M_QfL7YC2Bc9s9UMVCB";

const apiKeysRef = "-Ma1U51_omY_C4ZWMEWq";

let ordersData;

let fecthDataOrders;

let profileData;

var userExists = false;

var xpressCred = {};


//One-time use to push keys
// function pushApiKeys() {
//   var data = {
//     clientKeyD: '24aa5cc97aaa632e448440c31b18176506267b1e',
//       urlD: 'https://track.delhivery.com',
//       clientName: 'ACHYUTHA 0043179'
//   };
//   firebase
//       .app()
//       .database()
//       .ref(`/oms/clients/${clientRef}/apiKeys/delhivery/${apiKeysRef}`)
//       .update(data)
//       .then(function (resp) {
//         console.log('API Keys Posted');
//       });
// }

//Fetch API keys
function fetchApiKeys() {
  var apiKeys = firebase
  .app()
  .database()
  .ref(`/oms/clients/${clientRef}/apiKeys`);
  
  apiKeys
    .once("value")
    .then((snapshot) => {
      var apiKeys = snapshot.val();
      var delhiveryKeys = apiKeys.delhivery[apiKeysRef];
      var xpressbeeKeys = apiKeys.xpressbees[apiKeysRef];
      // console.  log(apiKeys);
      clientKeyD = delhiveryKeys.clientKeyD;
      urlD = delhiveryKeys.urlD;
      clientName = delhiveryKeys.clientName;
      xpressCred.username = xpressbeeKeys.username;
      xpressCred.password = xpressbeeKeys.password;

      if (page.indexOf('tracking.html') > -1) {
        console.log('Tracking Page');
      } else {
        if (!Cookies.get('xpressLogin')) {
          xpressbeeLogin();
        } else {
          console.log('XpreesBees Cookie exists');
        }
      }
    });
}

//Fetch all required API Keys
fetchApiKeys();


//Only admin should run
//  function deleteOldOrdersAdmin() {
//   firebase
//     .app()
//     .database()
//     .ref(`/oms/clients/${clientRef}/oldOrders`)
//     .remove()
//     .then((snapshot) => {
//       refreshMyOldOrders();
//     });
// }

function createOrder(data) {
  firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/orders`)
    .push(data)
    .then(function (resp) {
      orderSumitted(data, resp);
    });
}

function updateProfile(data) {
  $loading.show();
  firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/profile/${profileRef}`)
    .update(data)
    .then(function () {
      $loading.hide();
    });
}

function createCustomer(data) {
  var data = data.fields;
  var user = {
    name: data.name,
    address: data.address,
    city: data.city,
    pincode: data.pincode,
    state: data.state || "",
    country: data.country || "India",
    mobile: data.mobile,
    email: data.email,
    isReseller: false,
  };

  var obj = { user: user };

  firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/customers`)
    .push(obj)
    .then(function () {
      console.log("customer data posted");
    });
}

function fetchProfile() {
  var profile = firebase
  .app()
  .database()
  .ref(`/oms/clients/${clientRef}/profile/${profileRef}`);
  
  profile
    .once("value")
    .then((snapshot) => {
      profileData = snapshot.val().fields;
      renderProfile(profileData);
    });
}

function renderProfile(data) {
  $("#profileUpdate")
    .find(":input")
    .each(function () {
      var name = $(this).attr("name");
      $(this).val(data[name]);
    });
  initForm();
}

function orderSumitted(data, resp) {
  // console.log(data);
  var orderData = data.fields;
  const $printHtml = $("#element-to-print");
  if (orderData.vendor === "1") {
    $printHtml.find("h2").css("text-align", "center").text("Registered Parcel");
  } else {
    $printHtml.find("h2").css("text-align", "center").text("Courier");
  }
  $printHtml
    .find(".toAdd")
    .html(
      orderData.name +
      "<br>" +
      orderData.address.replace(/(?:\r\n|\r|\n)/g, "<br>") +
      "<br>" +
      orderData.city +
      "<br> Pincode: " +
      orderData.pincode +
      "<br> Mobile: " +
      orderData.mobile
    );

  $printHtml
    .find(".fromAdd")
    .html(
      (orderData.rname || profileData.cname) +
      "<br>" +
      (orderData.vendor === "1"
        ? profileData.retAddress.replace(/(?:\r\n|\r|\n)/g, "<br>") + "<br>"
        : "") +
      "Mobile: " +
      (orderData.rmobile || profileData.cnumber)
    );

  // console.log(orderData.rmobile, profileData.cnumber);
  $("#createOrder")[0].reset();
  $("#createOrder").addClass("hide");
  $("#printBtn").removeClass("hide");
  $("#saveBtn").removeClass("hide");
  $("#closePrintBtn").removeClass("hide");
  $printHtml.removeClass("hide");

  // if (!userExists) {
  //   createCustomer(data);
  // }

  // console.log(orderData);

  //Create Delhivery WayBill Number
  if (orderData.vendor === "2") {
    delhiveryApis(
      "GET",
      "/waybill/api/fetch/json/",
      {
        token: clientKeyD,
        client_name: clientName,
      },
      trackingDCallback,
      resp._delegate._path.pieces_
    );
  } else if (orderData.vendor === "4") {
    createXpressBeesOrder(orderData, resp._delegate._path.pieces_);
  } else {
    refreshOrders();
  }
}

function createXpressBeesOrder(value, target) {
  // console.log(value);
  var orderObj = {
    "id": value.ref.replace(' ', '-') + value.mobile.slice(-5),
    "payment_method": value.cod == "1" ? "COD" : "prepaid",
    "consigner_name": 'Sujatha one gram',
    "consigner_phone": "8886428888",
    "consigner_pincode": "521003",
    "consigner_city": "Machilipatnam",
    "consigner_state": "Andhra Pradesh",
    "consigner_address": "Sujatha gold covering works Near chilkalapudi circle, Machilipatnam",
    "consigner_gst_number": "",
    "consignee_name": value.name,
    "consignee_phone": value.mobile.replace("+91", ""),
    "consignee_pincode": value.pincode,
    "consignee_city": value.city,
    "consignee_state": value.state,
    "consignee_address": value.address.replace(/\s+/g, ' ').trim(),
    "consignee_gst_number": "",
    "products": [
      {
        "product_name": "Artificial Jewellery",
        "product_qty": value.qty || "1",
        "product_price": value.price || "5000",
        "product_tax_per": "",
        "product_sku": "SUJITEMS",
        "product_hsn": "0"
      }
    ],
    "invoice": [
      {
        "invoice_number": "INB002",
        "invoice_date": value.time,
        "ebill_number": "0",
        "ebill_expiry_date": "0"
      }
    ],
    "weight": "200",
    "length": "10",
    "height": "10",
    "breadth": "10",
    "courier_id": "3288",
    "pickup_location": "customer",
    "shipping_charges": "0",
    "cod_charges": "0",
    "discount": "0",
    "order_amount": value.price || "5000",
  }

  // console.log(orderObj);

  $.ajax({
    type: 'POST',
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('xpressLogin'));
    },
    url: 'https://ship.xpressbees.com/api/franchise/shipments',
    data: JSON.stringify(orderObj),
    contentType: "application/json; charset=utf-8"
  }).done(function (resp) {
    var data = JSON.parse(resp);
    // console.log(data);
    if (data.response) {
      // console.log(data.awb_number);
      trackingDCallback(data.awb_number, target);
    } else {
      alert(data.message);
      console.log('XpressBees Order Creation Failed');
    }
  }).fail(function (resp) {
    console.log(resp.message);
  })
}

//Call back after fetching delhivery waybill
// function trackingXCallback(data, OrderDetails) {
//   // console.log(data, OrderDetails);
//   var trackValue = data;
//   var orderId = OrderDetails[4];
//   //Update Tracking number for Delhivery Order
//   var orderRef = firebase
//     .app()
//     .database()
//     .ref(`/oms/clients/${clientRef}/orders/${orderId}/fields`);
//   orderRef
//     .update({
//       tracking: trackValue,
//     })
//     .then(function () {
//       refreshOrders();
//     });
// }

//Call back after fetching delhivery waybill
function trackingDCallback(data, OrderDetails) {
  // console.log(OrderDetails);
  var trackValue = data;
  var orderId = OrderDetails[4];
  //Update Tracking number for Delhivery Order
  var orderRef = firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/orders/${orderId}/fields`);
  orderRef
    .update({
      tracking: trackValue,
    })
    .then(function () {
      refreshOrders();
    });
}

//Click on Order tab
$("#orders-tab").click(function () {
  refreshOrders();
});

//Click on Order tab
// $("#myold-orders-tab").click(function () {
//   refreshMyOldOrders();
// });

//Refresh Orders
function refreshOrders() {
  if ($.fn.DataTable.isDataTable("#example")) {
    $("#example").dataTable().fnDestroy();
    fetchOrders("example");
  }
}

//Refresh Old Orders
// function refreshMyOldOrders() {
//   if ($.fn.DataTable.isDataTable("#oldexample")) {
//     $("#oldexample").dataTable().fnDestroy();
//   }
//   fetchOrders("oldexample");
// }

//Refresh Old Orders
function refreshOldOrders() {
  if ($.fn.DataTable.isDataTable("#oldOrdersexample")) {
    $("#oldOrdersexample").dataTable().fnDestroy();
    fetchOrders("oldOrdersexample");
  }
}

//Fetch Orders
function fetchOrders(div) {
  $loading.show();
  var orderRef = `/oms/clients/${clientRef}/orders`;
  var orders = firebase
  .app()
  .database()
  .ref(orderRef);
  
    orders
    .once("value")
    .then((snapshot) => {
      ordersData = snapshot.val();
      window.orderData = snapshot.val();
      // console.log(Object.keys(ordersData).length);
      renderOrders(div, ordersData, true);
      $loading.hide();
    });
}

//delete old Orders
function deleteOldOrders() {
  $loading.show();
  var orderRef = `/oms/clients/${clientRef}/orders`;

  var orders = firebase
  .app()
  .database()
  .ref(orderRef);
  
  orders
    .once("value")
    .then((snapshot) => {
      ordersData = snapshot.val();

      const today = moment();
      const sevenDaysBefore = moment().subtract(7, 'days');
      var parseData = [];

      console.log(Object.keys(ordersData).length);

      $.each(ordersData, function (key, value) {
        value.fields.key = key;
        parseData.push(value.fields);
      });

      console.log('orders length - ' + parseData.length);

      parseData = parseData.filter(function (order) {
        var date = new Date(formateDates(order.time));
        return date < sevenDaysBefore;
      });
      // console.log(parseData.length);
      $.each(parseData, function (key, value) {
        var orderKey = this.key;
        firebase
          .app()
          .database()
          .ref(orderRef + '/' + orderKey)
          .remove();
      });
      console.log(parseData.length);
      renderOrders('example', ordersData, true);
      $loading.hide();
    });
}

//convert date
function formateDates(date) {
  if (date && date.length) {
    var dateArr = date.split("-");
    dateArr.reverse();
    return dateArr.join("-");
  } else {
    return "null";
  }
}

// var currentTable;
function renderOrders(div, data, isParse) {
  let parseData;

  if (isParse) {
    parseData = [];
    $.each(data, function (key, value) {
      value.fields.key = key;
      parseData.push(value.fields);
    });
  } else {
    parseData = data;
  }

  // console.log(div);

  const today = new Date();
  const sevenDaysBefore = moment().subtract(5, 'days');

  if (div === 'example') {
    parseData = parseData.filter(function (order) {
      var date = new Date(formateDates(order.time));
      // console.log(date);
      return date >= sevenDaysBefore && date <= today;
    });
  } else if (div === 'oldexample') {
    parseData = parseData.filter(function (order) {
      var date = new Date(formateDates(order.time));
      // console.log(date);
      return date < sevenDaysBefore;
    });
  }

  // currentTable =
  $("#" + div).DataTable({
    data: parseData,
    order: [[1, "desc"]],
    "lengthMenu": [[25, 50, 100, 250, 500, -1], [25, 50, 100, 250, 500, "All"]],
    createdRow: function (row, parseData, dataIndex) {
      $(row).attr({
        "data-bs-id": parseData.key,
        //"data-bs-toggle": "modal",
        "data-bs-target": "#editModal",
      });
      // console.log(parseData);
      if (parseData.isDispatched) {
        $(row).addClass("orderDispatched");
      }
    },
    drawCallback: function () {
      if (div === "exportTable") {
        $("#exportOrders .bulkBtn").removeAttr("disabled");
      }

      if (div === "deleteOrdersTable") {
        $("#selectAll, .checkOrder").removeAttr("disabled");
      }

      $("body").on("click", "#selectAll", function () {
        var $table = $(this).closest("table");
        var isChecked = $(this).is(":checked");
        $table.find("tbody tr").each(function () {
          $(this).find("td:first input")[0].checked = isChecked;
        });
      });
    },
    columns: [
      {
        title: "<input id='selectAll' type='checkbox' />",
        orderable: false,
        style: "os",
        render: function () {
          return "<input name='rowOrder' class='checkOrder' type='checkbox' />";
        },
      },
      {
        title: "Date",
        width: "10%",
        data: "time",
        render: function (data) {
          if (data && data.length) {
            var from = data.split("-");
            return from[2] + "-" + from[1] + "-" + from[0];
          }
          return "";
        },
      },
      { title: "Name", data: "name", width: "10%" },
      { title: "Mobile", data: "mobile" },
      { title: "Reference", data: "ref" },
      { title: "Pincode", data: "pincode" },
      { title: "Reseller", data: "rname", width: "5%" },
      {
        title: "Courier",
        data: "vendor",
        className: "vendorClass",
        render: function (data) {
          var courier = "";
          switch (data) {
            case "1":
              courier = "India Post";
              break;
            case "2":
              courier = "Delhivery";
              break;
            case "3":
              courier = "DTDC";
              break;
            case "4":
              courier = "Xpressbees";
              break;
          }
          return courier;
        },
      },
      {
        title: "Tracking ID",
        data: "tracking",
        className: "trackingClass",
      },
      {
        title: "Order Status", width: "15%", data: "orderStatus",
        className: "statusClass",
        render: function (data) {
          var orderStatus = "Unknown";
          if (data) {
            orderStatus = data;
          }
          return orderStatus;
        }
      },
    ],
  });
}

function initForm() {
  // console.log("init form");
  $("[name=vendor]").trigger("change");
  $("#createOrder").find(".success").text("").removeClass("sucess");
}

function customSiginin(email, password) {
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
    });
}

function authCheck() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // logged in do nothing
    } else {
      var ui = new firebaseui.auth.AuthUI(firebase.auth());
      ui.start("#firebaseui-auth-container", {
        signInOptions: [
          {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            signInMethod:
              firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
          },
        ],
        signInSuccessUrl: window.location.href,
      });
      $("#auth-modal").addClass("show");
    }
  });
}

var $loading;

$(document).ready(function () {
  authCheck();

  var page = window.page;


  $loading = $(".loading");
  fetchOrders("example");
  fetchProfile();

  $("body").on("submit", "#createOrder", function (event) {
    event.preventDefault();
    var fields = {};
    $(this).find("[name=time]").val(moment().format("DD-MM-YYYY"));
    $(this)
      .find(":input")
      .not("button")
      .each(function () {
        fields[this.name] = $(this).val().trim();
      });
    var obj = { fields: fields };
    if (obj.fields.ref == "") {
      obj.fields.ref = obj.fields.mobile.slice(-5);
    }
    //create xpress order here

    createOrder(obj);
  });

  $("#profileUpdate").submit(function (event) {
    event.preventDefault();
    var fields = {};
    $(this)
      .find(":input")
      .not("button")
      .each(function () {
        fields[this.name] = $(this).val();
      });
    var obj = { fields: fields };
    updateProfile(obj);
  });

  $("#myOrders").on("click", ".updateTracking", function (e) {
    e.preventDefault();
    var rowId = $(this).closest("tr").attr("id");
    var trackValue = $(this).closest("td").find("[name=tracking]").val();
    var orderRef = firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/orders/${rowId}/fields`);
    orderRef
      .update({
        tracking: trackValue,
      })
      .then(function () {
        refreshOrders();
      });
  });

  $("#old-orders-tab").on("click", function (e) {
    e.preventDefault();
    if ($.fn.DataTable.isDataTable("#oldOrdersexample")) {
      $("#oldOrdersexample").dataTable().fnDestroy();
    }
    fetchOrders("oldOrdersexample");
  });

  $("#myOrders").on("click", ".editTracking", function (e) {
    e.preventDefault();
    var rowId = $(this).closest("tr").attr("id");
    var $trackEle = $(this).closest("td").find("[name=tracking]");
    var $btnEle = $(this).closest("td").find("button");
    var trackValue = $trackEle.val();
    $trackEle.removeAttr("readonly").focus();
    $btnEle.addClass("updateTracking").removeClass("editTracking").text("Save");
  });

  $("body").on("click", "#saveBtn", function (e) {
    e.preventDefault();
    var element = document.getElementById("element-to-print");
    var opt = {
      margin: 1,
      jsPDF: { unit: "in", format: "a5", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  });

  $("body").on("click", "#printBtn", function (e) {
    e.preventDefault();
    var element = document.getElementById("element-to-print");
    var opt = {
      margin: 1,
      jsPDF: { unit: "in", format: "a5", orientation: "portrait" },
    };
    html2pdf()
      .set(opt)
      .from(element)
      .output("blob")
      .then(function (blob) {
        // console.log(blob);
        let url = URL.createObjectURL(blob);
        window.open(url); //opens the pdf in a new tab
      });
  });

  $("#closePrintBtn").on("click", function (e) {
    e.preventDefault();
    $("#printBtn").addClass("hide");
    $("#saveBtn").addClass("hide");
    $("#closePrintBtn").addClass("hide");
    $("#createOrder").removeClass("hide");
    const $printHtml = $("#element-to-print");
    $printHtml.find("h2").text("l");
    $printHtml.find(".toAdd").html("");
    $printHtml.find(".fromAdd").html("");
    $printHtml.addClass("hide");
    initForm();
  });

  function editModalMethod(event) {
    var row = event.relatedTarget;
    var data = row["data-order-id"];
    $loading.show();
    var $updateOrderForm = $("#createOrder").clone(true);
    $updateOrderForm.removeClass("hide").find(".OrderSubmit").hide();
    $updateOrderForm.find(".dateId").removeClass("hide");
    $("#updateOrderContainer").html(
      $updateOrderForm.attr({
        id: "updateOrder",
        "data-order-id": data,
      })
    );

    var orderRef = firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/orders/${data}/fields`);

    orderRef.once("value").then((snapshot) => {
      var orderData = snapshot.val();
      // window.orderData = snapshot.val();

      // console.log(orderData);
      $("#updateOrder")
        .find("select")
        .each(function () {
          var $this = $(this);
          var name = $this.attr("name");
          $this.val(orderData[name]).trigger("change");
        });

      $("#updateOrder")
        .find(":input")
        .not("button, select")
        .each(function () {
          var $this = $(this);
          var name = $this.attr("name");
          $this.val(orderData[name]);
        });
      $loading.hide();
    });
  }

  // var $dataTable = $('.dataTable');
  $("body").on("click", ".dataTable tbody tr", function (event) {
    // console.log(event.target);
    if (!$(event.target).hasClass("checkOrder")) {
      $("#editModal").modal("show", {
        "data-order-id": $(this).attr("data-bs-id"),
      });
    }
  });

  var $editModal = $("#editModal");
  $editModal.on("show.bs.modal", function (event) {
    // console.log(event, data);
    editModalMethod(event);
  });

  $editModal.on("hidden.bs.modal", function (event) {
    $("#updateOrder").html("");
  });

  $("body").on("submit", "#updateOrder", function (event) {
    event.preventDefault();
    var fields = {};
    var orderId = $(this).attr("data-order-id");

    // $(this).find("[name=time]").text(moment().format("DD-MM-YYYY"));
    $(this)
      .find(":input")
      .not("button")
      .each(function () {
        fields[this.name] = $(this).val();
      });

    var obj = { fields: fields };
    if (obj.fields.ref == "") {
      obj.fields.ref = obj.fields.mobile.slice(-5);
    }

    if (!obj.fields.key || obj.fields.key == "") {
      obj.fields.key = orderId;
    }

    // console.log(obj);

    var orderRef = firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/orders/${orderId}`);

    orderRef.update(obj).then(function () {
      $(".modal").find(".btn-close").click();
      refreshOrders();
    });
  });

  $(".submitUpdate").click(function () {
    $("#updateOrder").submit();
  });

  $(".cancelUpdate").click(function () {
    $("#updateOrder")[0].reset();
  });

  //Calender Plugin
  $("#fromdatepicker, #fromdatepicker1").datepicker({
    dateFormat: "dd-mm-yy",
  });
  $("#todatepicker, #todatepicker1").datepicker({
    dateFormat: "dd-mm-yy",
  });

  $("#exportOrder").change(function () {
    $("#exportOrders .bulkBtn").attr("disabled", "disabled");
  });

  //convert date
  function formateDate(date) {
    if (date && date.length) {
      var dateArr = date.split("-");
      dateArr.reverse();
      return dateArr.join("-");
    } else {
      return "null";
    }
  }



  var exportData;
  // fetchTableOrders('exportOrder', 'exportTable');

  $("#exportOrder").submit(function (event) {
    event.preventDefault();
    fetchTableOrders(this, "exportTable");
  });

  $("#deleteOrders").submit(function (event) {
    event.preventDefault();
    fetchTableOrders(this, "deleteOrdersTable");
  });

  //Export orders table
  function fetchTableOrders(order, table) {
    var filters = {};
    $(order)
      .find(":input")
      .not("button")
      .each(function () {
        filters[this.name] = $(this).val();
      });
      
      var orders = firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/orders`);

      orders
      .once("value")
      .then((snapshot) => {
        ordersData = snapshot.val();
        fetchOrderFunc(ordersData, table, filters);
      });
  }

  //Export orders inner function
  function fetchOrderFunc(ordersData, table, filters) {
    let parseData = [];
    $.each(ordersData, function (key, value) {
      value.fields.key = key;
      parseData.push(value.fields);
    });

    var filteredOrders = parseData.filter(function (order) {
      return order.vendor == filters.vendor && !order.isDispatched;
    });

    var startDate = new Date(formateDate(filters.fromdatepicker));
    var endDate;

    if (formateDate(filters.todatepicker) == "null") {
      endDate = new Date(formateDate(filters.fromdatepicker));
    } else {
      endDate = new Date(formateDate(filters.todatepicker));
    }

    var resultProductData = filteredOrders.filter(function (order) {
      var date = new Date(formateDate(order.time));
      return date >= startDate && date <= endDate;
    });

    if ($.fn.DataTable.isDataTable("#" + table)) {
      $("#" + table)
        .dataTable()
        .fnDestroy();
    }

    exportData = resultProductData;
    renderOrders(table, resultProductData, false);
  }

  $(".bulkBtn").click(function (e) {
    e.preventDefault();
    var vendor = $("#exportOrders").find("[name=vendor").val();
    generateXL(vendor, exportData);
  });

  $("[name=cod]").change(function () {
    var $this = $(this);
    var $form = $this.closest("form");
    var val = $this.val();
    if (val == 0) {
      $form.find(".hide-cod").removeClass("show-cod");
    } else {
      $form.find(".hide-cod").addClass("show-cod");
    }
  });

  //Select Vendor Change
  $("[name=vendor]").change(function () {
    var $this = $(this);
    var $form = $this.closest("form");
    var $pin = $form.find("[name=pincode]");
    var val = $this.val();
    var pickupDArray = profileData ? profileData.pickup.split(",") : [];
    var options = "";
    $(pickupDArray).each(function (i, key) {
      options = options + "<option>" + key.trim() + "</option>";
    });
    var $pickupD = $form.find("[name=pickupD]").html(options);
    var city = $form.find("[name=city]").val();
    if (val == 2 || val == 4) {
      $form.find(".hide-2").addClass("show-2");
      $pin.addClass("pinSearch");
    } else {
      $form.find("[name=city]").val(city).removeAttr("readonly");
      $form.find("[name=state]").val("").removeAttr("readonly");
      $form.find("[name=country]").val("").removeAttr("readonly");
      $form.find(".hide-2").removeClass("show-2");
      $pin.removeClass("pinSearch");
    }
  });

  $('body').on("blur", '.pinSearch', function (event) {
    var city, state, country;
    var $this = $(this);
    var $form = $this.closest("form");
    var pincode = $this.val();
    var val = $form.find('[name=vendor').val();

    var obj = window.pincodes.filter(function (key) {
      return key.pin == pincode;
    });

    if (obj.length) {
      city = obj[0].city;
      state = obj[0].State;
      country = "India";
      $form.find("[name=city]").val(city); //.attr("readonly", "");
      $form.find("[name=state]").val(state); //.attr("readonly", "");
      $form.find("[name=country]").val(country); //.attr("readonly", "");
    }

    if (val == '2') {
      delhiveryApis(
        "GET",
        "/c/api/pin-codes/json/",
        {
          token: clientKeyD,
          filter_codes: pincode,
        },
        pincodeCallback,
        event.target
      );
    } else if (val == '4') {
      console.log('xpress pincode');
    }

  });

  //Tracking Code
  var $trackingForm = $("#tracking");
  $(".findOrders").click(function (e) {
    e.preventDefault();
    var mobile = $trackingForm.find("[name=mobile]").val();
    $("#orderResults").removeClass("hide");

    var orders = firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/orders`);

    orders
      .once("value")
      .then((snapshot) => {
        ordersData = snapshot.val();

        let parseData = [];
        $.each(ordersData, function (key, value) {
          value.fields.key = key;
          parseData.push(value.fields);
        });

        var filteredOrders = parseData.filter(function (order) {
          return order.mobile == mobile;
        });

        if ($.fn.DataTable.isDataTable("#trackingTable")) {
          $("#trackingTable").dataTable().fnDestroy();
        }

        $.each(filteredOrders, function (key, value) {
          this.tracking = this.vendor + "_" + this.tracking;
        });

        $("#trackingTable").DataTable({
          responsive: true,
          data: filteredOrders,
          drawCallback: function () {
            $("#trackingTable tbody")
              .find("tr")
              .each(function () {
                var data = $(this).find("td:last").text();
                var linkEl;
                var details;
                var link;
                var courier = "";
                var tracking = "";
                if (data && data.length) {
                  details = data.split("_");
                  if (details[0] == "1") {
                    courier = "india-post";
                  } else if (details[0] == "2") {
                    courier = "delhivery";
                  } else if (details[0] == "3") {
                    courier = "dtdc";
                  } else if (details[0] == "4") {
                    courier = "xpressbees";
                  }
                  if (details[1] && details[1].trim().length) {
                    tracking = details[1];
                    link =
                      "https://track.aftership.com/trackings?courier=" +
                      courier +
                      "&tracking-numbers=" +
                      tracking;
                  }

                  if (link && link.length) {
                    linkEl =
                      'Click here -> <a target="_blank" href="' +
                      link +
                      '">' +
                      tracking +
                      "</a>";
                  } else {
                    if (courier.length) linkEl = "Pending";
                  }
                  $(this).find("td:last").html(linkEl);
                }
              });
          },
          columns: [
            { title: "Name", data: "name" },
            { title: "Mobile", data: "mobile" },
            {
              title: "Tracking",
              data: "tracking",
              render: function (data) {
                return data;
              },
            },
          ],
        });

        // renderOrders("trackingTable", filteredOrders, false);
      });
  });

  var removeByAttr = function (arr, attr, value) {
    var i = arr.length;
    while (i--) {
      if (
        arr[i] &&
        arr[i].hasOwnProperty(attr) &&
        arguments.length > 2 &&
        arr[i][attr] === value
      ) {
        arr.splice(i, 1);
      }
    }
    return arr;
  };

  $(".groupAction").click(function (e) {
    e.preventDefault();
    var $this = $(this);
    var table = $("#example");
    var rows = table.find("tbody tr");
    var selectedRows = [];
    var rowLis = [];
    rows.each(function () {
      var row = $(this);
      var rowObj = {
        id: row.attr("data-bs-id"),
        vendor: row.find('.vendorClass').text(),
        tracking: row.find('.trackingClass').text()
      };
      var checkbox = row.find(".checkOrder");
      var disp = checkbox.is(":checked");
      if (disp) {
        selectedRows.push(row.attr("data-bs-id"));
        rowLis.push(rowObj);
      }
    });
    console.log(rowLis);
    $(e.target).attr("disabled", "disabled");
    if ($this.hasClass("dispatched")) {
      markAsDispatched(selectedRows, e);
    } else if ($this.hasClass("printSlip")) {
      printSlips(selectedRows, e);
    } else if ($this.hasClass("deleteOrders")) {
      deleteOrders(selectedRows, e);
    } 
    // else if ($this.hasClass("move-to-old")) {
    //   moveToOldOrders(selectedRows, e);
    // } 
    else if ($this.hasClass("xpressStatus")) {
      checkXpressBeesStatus(rowLis, e);
    } 
    // else if ($this.hasClass("fetchData")) {
    //   fetchStatus(selectedRows, e);
    // }
  });

  // function fetchStatus(data, e) {
  //   var tableId = $(e.target).closest('.tab-pane').attr('id');
  //   $(data).each(function (index, val) {
  //     var orderId = val;
  //     var orderRef = `/oms/clients/${clientRef}/orders/${orderId}`;
  //     firebase
  //       .app()
  //       .database()
  //       .ref(orderRef)
  //       .once("value")
  //       .then((snapshot) => {
  //         ordersData = snapshot.val();
  //         console.log(ordersData);
  //       });
  //   });

  //   $(e.target).removeAttr("disabled");

  // }

  //CheckXpress
  function checkXpressBeesStatus(data, e) {
    var tableId = $(e.target).closest('.tab-pane').attr('id');

    $(data).each(function () {
      // console.log(this);
      var orderId = this.id;
      var vendor = this.vendor;
      var tracking = this.tracking;
      var orderRef = `/oms/clients/${clientRef}/orders/${orderId}/fields/`;

      if (vendor === 'Xpressbees') {
        $.ajax({
          type: 'POST',
          beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('xpressLogin'));
          },
          url: 'https://ship.xpressbees.com/api/franchise/shipments/track_shipment',
          data: JSON.stringify({
            "awb_number": tracking
          }),
          contentType: "application/json; charset=utf-8"
        }).done(function (resp) {
          // console.log(resp);
          var data = resp["tracking_data"];
          var msgStatus = "";
          if (!data) {
            // console.log(resp.message);
            var msg = resp.message.split('current status:');
            var disp = msg[1].trim();
            firebase
              .app()
              .database()
              .ref(orderRef)
              .update({
                orderStatus: disp
              });
            return;
          }
          if (data["in transit"]) {
            console.log(data["in transit"][0].ship_status);
            msgStatus = data["in transit"][0].ship_status;
          } else if (data["pending pickup"]) {
            console.log(data["pending pickup"][0].ship_status);
            msgStatus = data["pending pickup"][0].ship_status;
          }
          firebase
            .app()
            .database()
            .ref(orderRef)
            .update({
              orderStatus: msgStatus
            });
        }).fail(function (resp) {
          console.log(resp.message);
        })
      } else if (vendor === 'Delhivery') {
        $.ajax({
          url: 'https://track.delhivery.com/api/v1/packages/json/?token=' + clientKeyD + '&waybill=' + tracking,
          dataType: 'jsonp',
          success: function (resp) {
            if(resp.Error) {
              firebase
              .app()
              .database()
              .ref(orderRef)
              .update({
                orderStatus: resp.Error
              });
            } else {
              var data = resp.ShipmentData[0];
              var status = data.Shipment.Status.Status;
              firebase
              .app()
              .database()
              .ref(orderRef)
              .update({
                orderStatus: status
              });
            }
          }
        });
      }
    });
    // refreshOrders(tableId);
    $(e.target).removeAttr("disabled");
  }

  //Mark as dispatched
  function deleteOrders(data, e) {
    var tableId = $(e.target).closest('.tab-pane').attr('id');
    $(data).each(function (index, val) {
      var orderId = val;
      var orderRef = `/oms/clients/${clientRef}/orders/${orderId}`;
      if (tableId == 'oldOrders') {
        orderRef = `/oms/clients/${clientRef}/oldOrders/${orderId}`;
      }
      firebase
        .app()
        .database()
        .ref(orderRef)
        .remove();
      // removeByAttr(arr, 'key', orderId);
    });
    // refreshOrders();
    if (tableId == 'oldOrders') {
      refreshOldOrders();
    } else {
      refreshOrders();
    }
    $(e.target).removeAttr("disabled");
  }

  //Move to Old Orders
  // function moveToOldOrders(data, e) {
  //   $(data).each(function (index, val) {
  //     var orderId = val;
  //     firebase
  //       .app()
  //       .database()
  //       .ref(`/oms/clients/${clientRef}/orders/${orderId}`)
  //       .once("value").then((snapshot) => {
  //         var orderData = snapshot.val();
  //         firebase
  //           .app()
  //           .database()
  //           .ref(`/oms/clients/${clientRef}/oldOrders/${orderId}`)
  //           .update(orderData);
  //       });
  //   });
  //   deleteOrders(data, e);
  //   $(e.target).removeAttr("disabled");
  // }

  //Mark as dispatched
  function markAsDispatched(data, e) {
    var isDone = false;
    var $target = $(e.target);
    if ($target.hasClass('is-true')) {
      isDone = true;
    }
    $(data).each(function (index, val) {
      var orderId = val;
      firebase
        .app()
        .database()
        .ref(`/oms/clients/${clientRef}/orders/${orderId}/fields`)
        .update({
          isDispatched: isDone,
        });
    });
    refreshOrders();
    $target.removeAttr("disabled");
  }

  var countSlips;
  
  //Print Slips
  function printSlips(data, e) {
    countSlips = data.length;
    $printHtml = $("#bulk-to-print").html("");
    $printHtml.removeClass("hide");

    $(data).each(function (index, val) {
      var orderId = val;
      var orderData;
      if(window.orderData[orderId]) {
        orderData = window.orderData[orderId].fields;
      } else {
        var orderRef = firebase
        .app()
        .database()
        .ref(`/oms/clients/${clientRef}/orders/${orderId}/fields`);

        orderRef.once("value").then((snapshot) => {
          orderData = snapshot.val();
        });
      }
      // console.log(orderData)
      generatePdf(orderData, index);
    });

    $(e.target).removeAttr("disabled");
  }

  //generate PDF
  function generatePdf(data, index) {
    if(!data)  {
      return;
    }
    var orderData = data;
    var $pageBreak = $('<div class="html2pdf__page-break">');
    var payment = orderData.cod == "1" ? "COD" : "PREPAID/PAID"

    if (orderData.vendor === "1") {
      $pageBreak.append("<h2>" + "Registered Parcel" + "</h2><br>");
    } else if (orderData.vendor === "2") {
      // $pageBreak.append("<h1 class='logo-align center-align'><img src='suj.png'></h2><br>");
      $pageBreak.append("<h2 class='center-align'>" + "Delhivery Courier" + "</h2><br>");
      $pageBreak.append("<h3 class='center-align'>" + payment + (orderData.codprice || '') + "</h3><br>");
      $pageBreak.append("<h3 class='center-align'><svg class='barcode-track' data-tracking=" + orderData.tracking + "></svg></h3>");
    } else if (orderData.vendor === "4") {
      // $pageBreak.append("<h1 class='logo-align center-align'><img src='suj.png'></h2><br>");
      $pageBreak.append("<h2 class='center-align'>" + "XpressBees Courier" + "</h2><br>");
      $pageBreak.append("<h3 class='center-align'>" + payment + (orderData.cod == "1" ? ": Rs." : "") + ((orderData.codprice + "/-") || '') + "</h3><br>");
      $pageBreak.append("<h3 class='center-align'><svg class='barcode-track' data-tracking=" + orderData.tracking + "></svg></h3>");
    }
    else {
      $pageBreak.append("<h2>" + "Courier" + "</h2><br>");
    }

    // $printHtml.append('<div class="html2pdf__page-break"></div>');
    // var $pageBreak = $printHtml.find(".html2pdf__page-break");
    $pageBreak
      .append("<div class='toAdd'><h4>To:</h4></div>")
      .append(
        orderData.name +
        "<br>" +
        orderData.address.replace(/(?:\r\n|\r|\n)/g, "<br>") +
        "<br>" +
        orderData.city +
        "<br> Pincode: " +
        orderData.pincode +
        "<br> Mobile: " +
        orderData.mobile
      );
    $pageBreak.append("<br><br>Ref:" + orderData.ref + "<br><br><br>");

    if (orderData.vendor === "1") {
      $pageBreak
      .append("<div class='fromAdd'><h4>From:</h4></div>")
      .append(
        (orderData.rname || profileData.cname) +
        "<br>" +
        (orderData.vendor === "1"
          ? profileData.retAddress.replace(/(?:\r\n|\r|\n)/g, "<br>") + "<br>"
          : "") +
        "Mobile: " +
        (orderData.rmobile || profileData.cnumber)
      );
    }
    

    $printHtml.append($pageBreak);

    $('.barcode-track').each(function () {
      var $this = $(this);
      var tracking = $this.attr('data-tracking');
      $this.JsBarcode(tracking);
    })

    if (index + 1 === countSlips) {
      // console.log(countSlips, index, $printHtml.height());
      // $printHtml.css('height', $printHtml.height() * 1.25);
      var element = $printHtml[0];
      var opt = {
        margin: 1,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        pagesplit: true,
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      html2pdf()
        .set(opt)
        .from(element) //.save();
        .output("blob")
        .then(function (blob) {
          let url = URL.createObjectURL(blob);
          window.open(url); //opens the pdf in a new tab
          $printHtml.addClass("hide");
        });
    }
  }

  //Mobile Number Validation
  $("[name=mobile]").blur(function (e) {
    e.preventDefault();
    var $form = $(e.target).closest("form");
    var mobile = $form.find("[name=mobile");
    var message = $form.find(".mobileMessage");
    $form.find(".mobileMessage");
    if (!mobile.val().match("[0-9]{10}") && message) {
      // console.log("Please put 10 digit mobile number");
      message.addClass("error").removeClass("hide");
      message[0].innerHTML = "Required 10 digits for mobile number";
      return;
    } else {
      message.addClass("hide");
    }
  });
});

window.onload = function () {
  // initForm();
  setTimeout(function () {
    if (!$(".loading").hasClass("hide")) {
      $(".loading").addClass("hide");
    }
  }, 5000);


};

function generateXL(type, data) {
  var createXLSLFormatObj = [];
  var xlsHeader;
  /* XLS Rows Data */
  var xlsRows = [];

  //India Post
  if (type == "1") {
    /* XLS Head Columns */
    xlsHeader = [
      "SL",
      "Barcode",
      "Ref",
      "City",
      "Pincode",
      "Name",
      "ADD1",
      "ADD2",
      "ADD3",
      "ADDREMAIL",
      "ADDRMOBILE",
      "SENDERMOBILE",
      "Weight",
      "COD",
      "InsVal",
      "VPP",
      "PrPdAmount",
      "PrPdType",
      "FMLisenceId",
      "FMSomNo",
      "L",
      "B",
      "H",
      "ContentType",
    ];

    $.each(data, function (index, value) {
      xlsRows.push({
        SL: index + 1,
        Barcode: value.tracking,
        Ref: "",
        City: value.city,
        Pincode: value.pincode,
        Name: value.name,
        ADD1: value.address,
        ADD2: "",
        ADD3: "",
        ADDREMAIL: value.email,
        ADDRMOBILE: value.mobile,
        SENDERMOBILE: value.rmobile,
        Weight: value.weight,
        COD: "",
        InsVal: "",
        VPP: "",
        PrPdAmount: "",
        PrPdType: "",
        FMLisenceId: "",
        FMSomNo: "",
        L: "",
        B: "",
        H: "",
        ContentType: "",
      });
    });
  } else if (type == "2") {
    /* XLS Head Columns */
    xlsHeader = [
      "Waybill",
      "Reference No",
      "Consignee Name",
      "City",
      "State",
      "Country",
      "Address",
      "Pincode",
      "Phone",
      "Mobile",
      "Weight",
      "Shipment Length",
      "Shipment Breadth",
      "Shipment Height",
      "Payment Mode",
      "Package Amount",
      "Cod Amount",
      "Product to be Shipped",
      "Return Address",
      "Return Pin",
      "fragile_shipment",
      "Seller Name",
      "Seller Address",
      "Seller CST No",
      "Seller TIN",
      "Invoice No",
      "Invoice Date",
      "Quantity",
      "Commodity Value",
      "Tax Value",
      "Category of Goods",
      "Seller_GST_TIN",
      "HSN_Code",
      "Return Reason",
      "Vendor Pickup Location",
      "EWBN",
    ];

    $.each(data, function (index, value) {
      xlsRows.push({
        Waybill: value.tracking || "",
        ReferenceNo: value.ref || value.mobile.slice(-5),
        ConsigneeName: value.name,
        City: value.city,
        State: value.state,
        Country: value.country || "India",
        Address: value.address,
        Pincode: value.pincode,
        Phone: "",
        Mobile: value.mobile.replace("+91", ""),
        Weight: value.weight || "100",
        ShipmentLength: value.ShipmentLength || "10",
        ShipmentBreadth: value.ShipmentBreadth || "10",
        ShipmentHeight: value.ShipmentHeight || "10",
        PaymentMode: value.cod == "1" ? "cod" : "prepaid",
        PackageAmount: value.price || "5000",
        CodAmount: value.codprice,
        ProductToBeShipped: value.productName || "Artificial Jewel",
        ReturnAddress: profileData.retAddress,
        ReturnPin: profileData.rpin,
        fragileShipment: value.fragile || "false",
        SellerName: value.rname,
        SellerAddress: profileData.retAddress,
        SellerCSTNo: "",
        SellerTIN: "",
        InvoiceNo: "",
        InvoiceDate: "",
        Quantity: value.qty || "1",
        CommodityValue: value.price || "5000",
        TaxValue: value.tax || "0",
        CategoryOfGoods: value.goods || "Artificial Jewel",
        SellerGSTTIN: "",
        HSNCode: "",
        ReturnReason: "",
        VendorPickupLocation: value.pickupD,
        EWBN: "",
      });
    });
  } else if (type == "4") {
    /* XLS Head Columns */
    xlsHeader = [
      "Order ID",
      "Payment Type",
      "Pickup From",
      "Consigner Name",
      "Consigner Phone",
      "Consigner Address",
      "Consigner City",
      "Consigner State",
      "Consigner Pincode",
      "Consigner GST",
      "Consignee Name",
      "Consignee Phone",
      "Consignee Address",
      "Consignee City",
      "Consignee State",
      "Consignee Pincode",
      "Consignee GST",
      "Courier Mode",
      "Invoice Number",
      "Invoice Date",
      "EBN Number",
      "EBN Expiry",
      "Weight(gm)",
      "Length(cm)",
      "Height(cm)",
      "Breadth(cm)",
      "SKU(1)",
      "Product(1)",
      "Quantity(1)",
      "Price(1)",
      "HSN(1)",
      "SKU(2)",
      "Product(2)",
      "Quantity(2)",
      "Price(2)",
      "HSN(2)",
      "SKU(3)",
      "Product(3)",
      "Quantity(3)",
      "Price(3)",
      "HSN(3)"
    ];

    $.each(data, function (index, value) {
      xlsRows.push({
        OrderID: value.ref.replace(' ', '-') + value.mobile.slice(-5),
        PaymentType: value.cod == "1" ? "COD" : "Prepaid",
        PickupFrom: 'Consigner',
        ConsignerName: 'Sujatha one gram',
        ConsignerPhone: '8886428888',
        ConsignerAddress: 'Sujatha gold covering works Near chilkalapudi circle, Machilipatnam',
        ConsignerCity: 'Machilipatnam',
        ConsignerState: 'Andhra Pradesh',
        ConsignerPincode: '521003',
        ConsignerGST: '',
        ConsigneeName: value.name,
        ConsigneePhone: value.mobile.replace("+91", ""),
        ConsigneeAddress: value.address.replace(/\s+/g, ' ').trim(),
        ConsigneeCity: value.city,
        ConsigneeState: value.state,
        ConsigneePincode: value.pincode,
        ConsigneeGST: '',
        CourierMode: 'Surface',
        InvoiceNumber: '',
        InvoiceDate: '',
        EBNNumber: '',
        EBNExpiry: '',
        Weight: '100',
        Length: '10',
        Height: '10',
        Breadth: '10',
        SKU1: '0',
        Product1: 'Artificial Jewel',
        Quantity1: value.qty || "1",
        Price1: value.price || "5000",
        HSN1: '0',
        SKU2: '0',
        Product2: '0',
        Quantity2: '0',
        Price2: "0",
        HSN2: '0',
        SKU3: '0',
        Product5: '0',
        Quantity3: '0',
        Price3: '0',
        HSN3: '0'
      });
    });
  } else {
    console.log("Export is not available for this vendor");
    return;
  }

  createXLSLFormatObj.push(xlsHeader);
  $.each(xlsRows, function (index, value) {
    var innerRowData = [];
    $.each(value, function (ind, val) {
      innerRowData.push(val);
    });
    createXLSLFormatObj.push(innerRowData);
  });

  /* File Name */
  var filename = "Delhivery_Bulk_Order.xlsx";

  if (type == '4') {
    filename = "XpressBee_Bulk_Order.csv";
  }

  /* Sheet Name */
  var ws_name = "Sheet1";

  if (typeof console !== "undefined") console.log(new Date());

  var wb = XLSX.utils.book_new(),
    ws = XLSX.utils.aoa_to_sheet(createXLSLFormatObj);

  var csv = XLSX.utils.sheet_to_csv(ws, { strip: true });

  // if(type != '4') {

  // } else {
  //   var wb = XLSX.utils.book_new(),
  //   ws = XLSX.utils.sheet_to_csv(createXLSLFormatObj);
  // }


  if (type == '4') {
    download_file(csv, filename, 'text/csv;encoding:utf-8');
  } else {
    /* Add worksheet to workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    /* Write workbook and Download */
    if (typeof console !== "undefined") console.log(new Date());
    XLSX.writeFile(wb, filename);
    if (typeof console !== "undefined") console.log(new Date());
  }
}

function download_file(content, fileName, mimeType) {
  var a = document.createElement('a');
  mimeType = mimeType || 'application/octet-stream';

  if (navigator.msSaveBlob) { // IE10
    navigator.msSaveBlob(new Blob([content], {
      type: mimeType
    }), fileName);
  } else if (URL && 'download' in a) { //html5 A[download]
    a.href = URL.createObjectURL(new Blob([content], {
      type: mimeType
    }));
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
  }
}


function delhiveryApis(method, service, data, callback, target) {
  $.ajax({
    type: method,
    url: urlD + service,
    data: data,
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    dataType: "jsonp",
  }).done(function (data) {
    if (console && console.log) {
      callback(data, target);
    }
  });
}

var pinCodeData;
function pincodeCallback(data, target) {
  if (data.delivery_codes.length) {
    pinCodeData = data.delivery_codes[0].postal_code;
    pinCodeData.isInvalid = false;
  } else {
    pinCodeData = {
      isInvalid: true,
    };
  }
  // console.log(pinCodeData);
  var $ele = $(target);
  var $form = $ele.closest("form");
  // console.log(pinCodeData);
  if (pinCodeData.isInvalid) {
    $ele
      .next("span")
      .addClass("error")
      .removeClass("success")
      .text("Invalid or Unservicable Pincode");
  } else {
    $ele
      .next("span")
      .removeClass("error")
      .addClass("success")
      .text("Servicable Pincode");
  }
}


function xpressbeeLogin() {
  $.ajax({
    type: 'POST',
    url: 'https://ship.xpressbees.com/api/users/franchise_user_login',
    data: JSON.stringify(xpressCred),
    contentType: "application/json; charset=utf-8"
  }).done(function (data) {
    if (data.status) {
      createXpressCookie(data.data);
    } else {
      console.log('XpressBees Login Failed');
    }
  });
}

function createXpressCookie(cookie) {
  // console.log(cookie);

  var now = new Date();
  var time = now.getTime();
  time += 3600 * 1000;
  now.setTime(time);
  document.cookie =
    'xpressLogin=' + cookie +
    '; expires=' + now.toUTCString() +
    '; path=/';

  // var now = new Date();
  // now.setTime(now.getTime() + 1 * 3600 * 1000);

  // Cookies.set('xpressLogin', cookie, {expires : now.toUTCString()});

  // $('.vendorOption').find('option[value="4"]').removeAttr('disabled');

  // $.ajax({
  //   type: 'GET',
  //   beforeSend: function (xhr) {
  //     xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('xpressLogin'));
  //   },
  //   url: ' https://ship.xpressbees.com/api/franchise/shipments/courier',
  //   // data: JSON.stringify(orderObj),
  //   contentType: "application/json; charset=utf-8"
  // }).done(function (data) {
  //   if (data.response) {
  //     console.log(data.awb_number);
  //     // trackingDCallback(data.awb_number, value);
  //   } else {
  //     console.log('XpressBees Order Creation Failed');
  //   }
  // }).fail(function(resp){
  //   console.log(resp.message);
  // })
}
