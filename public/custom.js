//AA Jewels
// const firebaseConfig = {
//   apiKey: "AIzaSyCXEYAGXm0uV9M1bDbvL4HWlBBes5eo9DU",
//   authDomain: "aa-jewel-oms.firebaseapp.com",
//   databaseURL:
//     "https://aa-jewel-oms-default-rtdb.europe-west1.firebasedatabase.app",
//   projectId: "aa-jewel-oms",
//   storageBucket: "aa-jewel-oms.appspot.com",
//   messagingSenderId: "986868631414",
//   appId: "1:986868631414:web:8b0c71b9bf9a989aecdc57",
//   measurementId: "G-S7KHKNNSNW",
// };
//Sujatha
const firebaseConfig = {
  apiKey: "AIzaSyDC7WBF3_-NLb55bziNX-_ybpGxTIGOI1s",
  authDomain: "sujatha-gold-covering.firebaseapp.com",
  databaseURL: "https://sujatha-gold-covering-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sujatha-gold-covering",
  storageBucket: "sujatha-gold-covering.appspot.com",
  messagingSenderId: "944519518698",
  appId: "1:944519518698:web:8c47c36c1124655c65ba93"
};

firebase.initializeApp(firebaseConfig);

const clientRef = "-M_M99xUv7WD4c-I2-0z";

const profileRef = "-M_QfL7YC2Bc9s9UMVCB";

let ordersData;

let fecthDataOrders;

let profileData;

var userExists = false;

function createOrder(data) {
  firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/orders`)
    .push(data)
    .then(function () {
      console.log("data posted");
      orderSumitted(data);
    });
}

function updateProfile(data) {
  firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/profile/${profileRef}`)
    .update(data)
    .then(function () {
      console.log("profile data posted");
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

  //Insert reseller as customer
  // if(data.rname.length) {
  //   var ruser = {
  //     name: data.rname,
  //     mobile: data.rmobile,
  //     isReseller: true
  //   }
  //   var robj = { user: ruser };
  //   firebase
  //   .app()
  //   .database()
  //   .ref(`/oms/clients/${clientRef}/customers`)
  //   .push(robj)
  //   .then(function () {
  //     console.log("reseller data posted");
  //   });
  // }
}

function fetchProfile() {
  firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/profile/${profileRef}`)
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

function orderSumitted(data) {
  console.log(data);
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
        profileData.retAddress.replace(/(?:\r\n|\r|\n)/g, "<br>") +
        "<br> Mobile: " +
        (orderData.rmobile || profileData.cnumber)
    );
  // console.log(orderData.rmobile, profileData.cnumber);
  $("#createOrder")[0].reset();
  $("#createOrder").addClass("hide");
  $("#printBtn").removeClass("hide");
  $("#closePrintBtn").removeClass("hide");

  $printHtml.removeClass("hide");
  if (!userExists) {
    createCustomer(data);
  }
  refreshOrders();
}

function refreshOrders() {
  $("#example").dataTable().fnDestroy();
  fetchOrders("example");
}

// window.allOrders = [];

function fetchOrders(div) {
  firebase
    .app()
    .database()
    .ref(`/oms/clients/${clientRef}/orders`)
    .once("value")
    .then((snapshot) => {
      ordersData = snapshot.val();
      renderOrders(div, ordersData, true);
    });
}

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

  // window.allOrders = parseData;
  

  $("#" + div).DataTable({
    data: parseData,
    createdRow: function (row, parseData, dataIndex) {
      // console.log(parseData);
      $(row).attr({
        "data-bs-id": parseData.key,
        "data-bs-toggle": "modal",
        "data-bs-target": "#editModal",
      });
    },
    drawCallback: function () {
      if (div === "exportTable") {
        $("#exportOrders .bulkBtn").removeAttr("disabled");
      }
    },
    columns: [
      {
        title: "Date",
        data: "time",
        render: function (data) {
          if (data && data.length) {
            return data;
          }
          return "";
        },
      },
      { title: "Name", data: "name" },
      { title: "Mobile", data: "mobile" },
      { title: "Pincode", data: "pincode" },
      { title: "Reseller", data: "rname" },
      {
        title: "Courier",
        data: "vendor",
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
          }
          return courier;
        },
      },
      {
        title: "Tracking ID",
        data: "tracking",
      },
    ],
  });
}

// function updateBulkTracking() {
//   // console.log(window.allOrders);
//   var filterOrders = [];
//   var filterOrders = window.allOrders.filter(function (order) {
//     return order.vendor == '2';
//   });

//   var wayBillObj = {};
  
//   $(window.waybills).each(function(){
//     var ref = this.Order.trim();
//     var tracking = this.Waybill.trim();
//     wayBillObj[ref] = tracking;
//   });
//   $(filterOrders).each(function(){
//     var rowId = this.key;
//     // this.tracking = wayBillObj[this.ref] || '';
//     var orderRef = firebase
//       .app()
//       .database()
//       .ref(`/oms/clients/${clientRef}/orders/${rowId}/fields`);
//     orderRef
//       .update({
//         tracking: wayBillObj[this.ref] || ''
//       });
//   });
// }

function initForm() {
  console.log('init form');
  $("[name=vendor]").trigger('change');
}

$(document).ready(function () {
  fetchOrders("example");
  fetchProfile();

  $("#createOrder").submit(function (event) {
    event.preventDefault();
    var fields = {};
    $(this).find("[name=time]").val(moment().format("DD-MM-YYYY"));
    $(this)
      .find(":input")
      .not("button")
      .each(function () {
        fields[this.name] = $(this).val();
      });
    var obj = { fields: fields };
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

  $("#myOrders").on("click", ".editTracking", function (e) {
    e.preventDefault();
    var rowId = $(this).closest("tr").attr("id");
    var $trackEle = $(this).closest("td").find("[name=tracking]");
    var $btnEle = $(this).closest("td").find("button");
    var trackValue = $trackEle.val();
    $trackEle.removeAttr("readonly").focus();
    $btnEle.addClass("updateTracking").removeClass("editTracking").text("Save");
  });

  $("body").on("click", "#printBtn", function (e) {
    e.preventDefault();
    var element = document.getElementById("element-to-print");
    var opt = {
      margin: 1,
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  });

  $("#closePrintBtn").on("click", function (e) {
    e.preventDefault();
    $("#printBtn").addClass("hide");
    $("#closePrintBtn").addClass("hide");
    $("#createOrder").removeClass("hide");
    const $printHtml = $("#element-to-print");
    $printHtml.find("h2").text("l");
    $printHtml.find(".toAdd").html("");
    $printHtml.find(".fromAdd").html("");
    $printHtml.addClass("hide");
    initForm();
  });

  var $editModal = $("#editModal");
  $editModal.on("show.bs.modal", function (event) {
    // Button that triggered the modal
    var row = event.relatedTarget;

    // Extract info from data-bs-* attributes
    var data = $(row).data();
    var orderRef = firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/orders/${data.bsId}/fields`);

      orderRef.once("value").then((snapshot) => {
        var orderData = snapshot.val();
        // $('#updateOrder').find(':input:visible').each(function () {
        //   $this.val('');
        // });
        $editModal.find("#orderId").val(data.bsId);
        $('#updateOrder').find('[name=vendor]').val(orderData.vendor).trigger('change');
        console.log(orderData);
        
        $('#updateOrder')
          .find(":input:visible")
          .not("button")
          .each(function () {
            var $this = $(this);
            $this.val('');
            var name = $this.attr("name");
            $this.val(orderData[name]);//.find('[name=vendor]')
            // if ($this.is("input")) {
            //   $this.val(orderData[name]);
            // }
          });
      });
  });

  $("body").on("submit", "#updateOrder", function (event) {
    event.preventDefault();
    var fields = {};
    var orderId = $("#orderId").val();
    // $(this).find("[name=time]").text(moment().format("DD-MM-YYYY"));
    $(this)
      .find(":input")
      .not("button")
      .each(function () {
        fields[this.name] = $(this).val();
      });

    var obj = { fields: fields };
    console.log(obj);
    var orderRef = firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/orders/${orderId}`);
    //createOrder(obj);
    orderRef.update(obj).then(function () {
      $(".modal").find(".btn-close").click();
      refreshOrders();
      $(this)
      .find(":input")
      .not("button")
      .each(function () {
        $(this).val('');
      });
    });
  });

  $(".submitUpdate").click(function () {
    $("#updateOrder").submit();
  });

  $(".cancelUpdate").click(function () {
    $("#updateOrder")[0].reset();
    $('#updateOrder')
      .find(":input")
      .not("button")
      .each(function () {
        $(this).val('');
      });
  });

  //Calender Plugin
  $("#fromdatepicker").datepicker({
    dateFormat: "dd-mm-yy",
  });
  $("#todatepicker").datepicker({
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
  $("#exportOrder").submit(function (event) {
    event.preventDefault();
    var filters = {};
    $(this)
      .find(":input")
      .not("button")
      .each(function () {
        filters[this.name] = $(this).val();
      });

    firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/orders`)
      .once("value")
      .then((snapshot) => {
        ordersData = snapshot.val();

        let parseData = [];
        $.each(ordersData, function (key, value) {
          value.fields.key = key;
          parseData.push(value.fields);
        });

        var filteredOrders = parseData.filter(function (order) {
          return order.vendor == filters.vendor;
        });

        // console.log(filters.fromdatepicker, filters.todatepicker);

        var startDate = new Date(formateDate(filters.fromdatepicker));
        var endDate;

        if (formateDate(filters.todatepicker) == "null") {
          endDate = new Date(formateDate(filters.fromdatepicker));
        } else {
          endDate = new Date(formateDate(filters.todatepicker));
        }

        // console.log('endDate-'+formateDate(filters.todatepicker));

        var resultProductData = filteredOrders.filter(function (order) {
          var date = new Date(formateDate(order.time));
          // console.log(date, startDate, endDate);
          return date >= startDate && date <= endDate;
        });

        if ($.fn.DataTable.isDataTable("#exportTable")) {
          $("#exportTable").dataTable().fnDestroy();
        }
        exportData = resultProductData;
        renderOrders("exportTable", resultProductData, false);
      });
  });

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

    if (val == 2) {
      $form.find(".hide-2").addClass("show-2");
      $pin.addClass("pinSearch");
    } else {
      $form.find("[name=city]").val("").removeAttr("readonly");
      $form.find("[name=state]").val("").removeAttr("readonly");
      $form.find("[name=country]").val("").removeAttr("readonly");
      $form.find(".hide-2").removeClass("show-2");
      $pin.removeClass("pinSearch");
    }

    $form.on("blur", ".pinSearch", function (event) {
      var city, state, country;
      var pincode = $(".pinSearch").val();
      var obj = window.pincodes.filter(function (key) {
        return key.pin == pincode;
      });

      if (obj.length) {
        city = obj[0].city;
        state = obj[0].State;
        country = "India";
        // console.log(city, state, country);
        $form.find("[name=city]").val(city);//.attr("readonly", "");
        $form.find("[name=state]").val(state);//.attr("readonly", "");
        $form.find("[name=country]").val(country);//.attr("readonly", "");
      }

      delhiveryApis(
        "GET",
        "pin-codes/json/",
        {
          token: clientKeyD,
          filter_codes: pincode,
        },
        pincodeCallback,
        event.target
      );
    });
  });

  //Phone number fetch
  $("#createOrder").on("blur", "[name=mobile]", function () {
    var mobile = $(this).val();
    var mobileData = [];

    firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/customers`)
      .once("value")
      .then((snapshot) => {
        customersData = snapshot.val();
        $.each(customersData, function (key, value) {
          mobileData.push(value.user);
        });

        var obj = mobileData.filter(function (key) {
          return key.mobile == mobile;
        });

        if (!obj.length) return;

        $("#createOrder")
          .find(":input:visible")
          .not("select")
          .each(function () {
            var $this = $(this);
            var name = $this.attr("name");
            if (obj) {
              $this.val(obj[0][name] || "");
            }
          });
        userExists = true;
      });

    // var obj = window.pincodes.filter(function (key) {
    //   return key.pin == pincode;
    // });

    // if (obj.length) {
    //   city = obj[0].city;
    //   state = obj[0].State;
    //   country = "India";
    //   console.log(city, state, country);
    //   $form.find("[name=city]").val(city).attr("readonly", "");
    //   $form.find("[name=state]").val(state).attr("readonly", "");
    //   $form.find("[name=country]").val(country).attr("readonly", "");
    // }

    
  });

  //Tracking Code
  var $trackingForm = $("#tracking");
  $(".findOrders").click(function (e) {
    e.preventDefault();
    var mobile = $trackingForm.find("[name=mobile]").val();
    $("#orderResults").removeClass("hide");
    firebase
      .app()
      .database()
      .ref(`/oms/clients/${clientRef}/orders`)
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
            // { title: "Pincode", data: "pincode" },
            // { title: "Reseller", data: "rname" },
            // {
            //   title: "Courier",
            //   data: "vendor",
            //   render: function (data) {
            //     var courier = "";
            //     switch (data) {
            //       case "1":
            //         courier = "India Post";
            //         break;
            //       case "2":
            //         courier = "Delhivery";
            //         break;
            //       case "3":
            //         courier = "DTDC";
            //         break;
            //     }
            //     return courier;
            //   },
            // },
            {
              title: "Tracking",
              data: "tracking",
              render: function (data) {
                // var link;
                // if (data && data.length) {
                //   var courier = "";
                //   // if(vendor == '1') {
                //   //   courier = "india-post";
                //   // } else if (vendor == '2') {
                //   //   courier = "delhivery";
                //   // } else if (vendor == '3') {
                //   //   courier = "dtdc";
                //   // }
                //   // link = 'https://track.aftership.com/trackings?courier='+courier+'&tracking-numbers='+data;
                //   // return '<a target="_blank" href="'+link+'">'+data+'</a>';
                // }
                return data;
              },
            },
          ],
        });

        // renderOrders("trackingTable", filteredOrders, false);
      });
  });

  //Mobile Number Validation
  $('[name=mobile]').blur(function(e) {
    e.preventDefault();
    var $form = $(e.target).closest('form');
    var mobile = $form.find('[name=mobile');
    var  message = $form.find('.mobileMessage');
    $form.find('.mobileMessage');
    if(!mobile.val().match('[0-9]{10}'))  {
        console.log("Please put 10 digit mobile number");
        message.addClass('error').removeClass('hide');
        message[0].innerHTML = "Required 10 digits for mobile number";
        return;
    } else {
      message.addClass('hide')
    }
  });

  

});

window.onload = function(){
  // initForm();
}

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
        Waybill: "",
        ReferenceNo: value.ref || value.mobile.slice(-5),
        ConsigneeName: value.name,
        City: value.city,
        State: value.state,
        Country: value.country || "India",
        Address: value.address,
        Pincode: value.pincode,
        Phone: "",
        Mobile: value.mobile.replace("+91", ""),
        Weight: value.weight || "200",
        PaymentMode: value.cod == "1" ? "cod" : "prepaid",
        PackageAmount: value.price,
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
        CommodityValue: value.price || "500",
        TaxValue: value.tax || "0",
        CategoryOfGoods: value.goods || "Artificial Jewel",
        SellerGSTTIN: "",
        HSNCode: "",
        ReturnReason: "",
        VendorPickupLocation: value.pickupD,
        EWBN: "",
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
  var filename = "Bulk_Order.xlsx";

  /* Sheet Name */
  var ws_name = "Sheet1";

  if (typeof console !== "undefined") console.log(new Date());
  var wb = XLSX.utils.book_new(),
    ws = XLSX.utils.aoa_to_sheet(createXLSLFormatObj);

  /* Add worksheet to workbook */
  XLSX.utils.book_append_sheet(wb, ws, ws_name);

  /* Write workbook and Download */
  if (typeof console !== "undefined") console.log(new Date());
  XLSX.writeFile(wb, filename);
  if (typeof console !== "undefined") console.log(new Date());
}

//Delhivery APIs
//Stage Keys
// var clientKeyD = '8da3f652893522c4b1176d367ced95d90305d4f4';
// var urlD = 'https://staging-express.delhivery.com/c/api/'

//Prod Keys
var clientKeyD = "24aa5cc97aaa632e448440c31b18176506267b1e";
var urlD = "https://track.delhivery.com/c/api/";
function delhiveryApis(method, service, data, callback, target) {
  $.ajax({
    type: method,
    url: urlD + service,
    headers: {
      authorization: clientKeyD,
    },
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
  var $form = $ele.closest("form")
  console.log(pinCodeData);
  if (pinCodeData.isInvalid) {
    $ele
      .next("span")
      .addClass("error")
      .removeClass("success")
      .text("Invalid or Unservicable Pincode");
      // $form.find('[name=city]').val('');
      // $form.find('[name=state]').val('');
      // $form.find('[name=country]').val('');
  } else {
    $ele
      .next("span")
      .removeClass("error")
      .addClass("success")
      .text("Servicable Pincode");
      // $form.find('[name=city]').val('');
      // $form.find('[name=state]').val('');
      // $form.find('[name=country]').val('');
  }
}
