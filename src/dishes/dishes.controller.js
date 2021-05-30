const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// assign ID upon creation
const nextId = require("../utils/nextId"); 

function create(req, response) {
    const { data /*: { href } = {}*/ } = req.body;
    const newDish = {
        id: nextId(), ...data, // unpack data object into respective fields
    };
    dishes.push(newDish);
    response.status(201).json({ data: newDish });
}

function isValidObject(req, response, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    const SUFFIX = "must be supplied and non-empty";
    if (name && description && (typeof(price) == "number" &&
        Number(price) > 0) && image_url) {
      return next();
    }
    else if(!name)
        return next({ status: 400, message: `name ${SUFFIX}`});
    else if(!description/* == undefined*/)
        return next({ status: 400, message: `description ${SUFFIX}`});
    else if(typeof(price) != "number" || Number(price) <= 0)
        return next({ status: 400, message:
            "price must be supplied as a Number and strictly greater than 0"});
    else return next({ status: 400, message: `image_url ${SUFFIX}`});
}

function list(req, response) {
    response.json({ data: dishes });
}

function dishExists(req, response, next) {
    const dishId = req.params['dishId'];
    const foundDish = dishes.find((dish) => dish['id'] === dishId);
    if (foundDish) {
        response.locals['dish'] = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${req.params['dishId']}`,
    });
}

function read(req, response) {
    const foundDish = response.locals['dish'];
    response.json({ data: foundDish });
}

function isValidId(req, response, next) {
    const dishId = req.params['dishId'];
    const { data: { id } = {} } = req.body;
    if(!id || id == dishId)
        return next();
    next({ status: 400, message: `request body id not matched: ${id}`});
}

function update(req, response) {
    let foundDish = response.locals['dish'];
    const { data: { id, ...other } = {} } = req.body; // not updating id

    for(const [key, value] of Object.entries(other))
        foundDish[key] = value;
  
    response.json({ data: foundDish });
}

module.exports = {
    create: [isValidObject, create],
    list,
    read: [dishExists, read],
    update: [dishExists, isValidId, isValidObject, update],
    dishExists,
};