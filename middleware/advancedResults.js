const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };

  //Fields to exclude
  const removeFields = ["select", "sort", "limit", "page"];

  //Loop over removeFields and delete from query
  removeFields.forEach((param) => delete reqQuery[param]);

  //Create Operators GT, GTE, LT, LTE, IN
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => "$" + match
  );

  //Find resources
  query = model.find(JSON.parse(queryStr));

  //Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query.select(fields);
  }

  //Sort fields
  ///api/v1/bootcamps?select=name,description,createdAt&sort=-name      => AGREGAR UN NEGATIVO AL SORT INDICA UN -1 DE DESC
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query.sort(sortBy);
  } else {
    query.sort({ createdAt: -1 });
  }

  //Pagination fields
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();
  const pagination = {};

  query.skip(startIndex).limit(limit);

  //Populate
  if (populate) {
    query.populate(populate);
  }

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  //Excecute
  query
    .then((data) => {
      res.advancedResults = {
        success: true,
        count: data.length,
        pagination: pagination,
        data: data,
      };
      next();
    })
    .catch((err) => {
      next(err);
    });
};

module.exports = advancedResults;
