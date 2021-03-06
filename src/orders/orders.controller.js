const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// assign ID upon creation
const nextId = require("../utils/nextId");

function create(req, response) {
    const { data } = req.body;
    const newOrder = {
        id: nextId(), ...data, // unpack data object into respective fields
    };
    orders.push(newOrder);
    response.status(201).json({ data: newOrder });
}

function isValidObject(req, response, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    // removed first "dishes" boolean
    let okDishArr = Array.isArray(dishes) && dishes.length > 0;
    let failedQuantity = false;
    let idxFailed = undefined;
    if(okDishArr) {
        for(let k = 0; k < dishes.length; k++) {
            const { quantity } = dishes[k];
            if(!(Number.isInteger(quantity) && quantity > 0)) {
                failedQuantity = true; idxFailed = k;
                break;
            }
        }
    }
  
    const SUFFIX = "must be supplied and non-empty";
    if (deliverTo && mobileNumber && okDishArr && !failedQuantity) {
        return next();
    }
    else if(!deliverTo)
        return next({ status: 400, message: `deliverTo ${SUFFIX}`});
    else if(!mobileNumber)
        return next({ status: 400, message: `mobileNumber ${SUFFIX}`});
    else if(!okDishArr)
        return next({ status: 400, message:
            "Order must include an Array with at least one dish"});
    else if(failedQuantity)
        return next({ status: 400, message:
            `Dish ${idxFailed} must have a quantity that is an integer greater than 0`});
}

function list(req, response) {
    response.json({ data: orders });
}

function orderExists(req, response, next) {
    const orderId = req.params['orderId'];
    const foundOrder = orders.find((order) => order['id'] === orderId);
    if (foundOrder) {
        response.locals['order'] = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${req.params['orderId']}`,
    });
}

function read(req, response) {
    const foundOrder = response.locals['order'];
    response.json({ data: foundOrder });
}

function isValidId(req, response, next) {
    const orderId = req.params['orderId'];
    const { data: { id } = {} } = req.body;
    if(!id || id == orderId)
        return next();
    next({ status: 400, message: `request body id not matched: ${id}`});
}

function statusNotDelivered(req, response, next) {
    let foundOrder = response.locals['order'];
    let PERMISSIBLE_STATUS = ["pending", "preparing", "out-for-delivery", "delivered"];
    const { data: { status } = {} } = req.body;
    const idx_permissible = PERMISSIBLE_STATUS.findIndex(x => x==status);
    if(status && status.length > 0 && idx_permissible >= 0 &&
        foundOrder['status'] != "delivered")
        return next();
    else if(!status || status.length == 0 || idx_permissible < 0)
        return next({ status: 400, message:
            `Invalid. Order must have a status of ${PERMISSIBLE_STATUS.join(", ")}`});
    else return next({ status: 400, message:
        "A delivered order cannot be changed"});
}

function update(req, response) {
    let foundOrder = response.locals['order'];
    const { data: { id, ...other } = {} } = req.body; // not updating id

    for(const [key, value] of Object.entries(other))
        foundOrder[key] = value;
  
    response.json({ data: foundOrder });
}

function statusPending(req, response, next) {
    const foundOrder = response.locals['order'];
    const status = foundOrder['status'];
    if(status == "pending") return next();
    else return next({ status: 400, message:
        "An order cannot be deleted unless it is pending"});
}

function destroy(req, response) {
    const orderId = req.params['orderId'];
    const index = orders.findIndex((order) => order['id'] === orderId);
    if (index > -1) {
        orders.splice(index, 1);
        response.sendStatus(204);
    }
}

module.exports = {
    create: [isValidObject, create],
    list,
    read: [orderExists, read],
    update: [orderExists, isValidId, isValidObject, statusNotDelivered,
        update],
    delete: [orderExists, statusPending, destroy],
    orderExists,
};