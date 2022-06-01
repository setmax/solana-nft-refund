import moment from "moment";

//get different days between now and specific past date

export const getNumberOfDays = (unix_start_date) => {
  const dateString = moment.unix(unix_start_date).format("MM/DD/YYYY");

  const date1 = new Date(dateString);
  const date2 = Date.now();

  // One day in milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  // Calculating the time difference between two dates
  const diffInTime = date2 - date1.getTime();

  // Calculating the no. of days between two dates
  const diffInDays = Math.round(diffInTime / oneDay);

  return diffInDays;
};

export const delay = (ms) => new Promise((res) => setTimeout(res, ms));
