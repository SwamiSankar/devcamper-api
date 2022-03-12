const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  //Creating copy of request query
  const reqQuery = { ...req.query };

  //Creating an array that contains the fields to remove
  const removeElements = ['select', 'sort', 'page', 'limit'];

  //Loop through the fields and removing them from the request query
  removeElements.forEach((param) => delete reqQuery[param]);

  //Creating query string
  let queryStr = JSON.stringify(reqQuery);

  //Creating comparison operators
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  //Finding the resource based on requested query
  query = model.find(JSON.parse(queryStr));

  if (populate) {
    query = query.populate(populate);
  }

  //Select fields

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  //Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  //Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  //Executing Query
  const results = await query;

  //Pagination Result
  const pagination = {};

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
  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
