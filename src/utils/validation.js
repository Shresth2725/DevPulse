const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) throw new Error("Name not valid");
  else if (!validator.isEmail(emailId)) throw new Error("Email not valid");
  else if (!validator.isStrongPassword(password))
    throw new Error("Please enter a strong Password!");
};

const validateProfileEditData = (req) => {
  const allowedEditField = [
    "firstName",
    "lastName",
    "emailId",
    "photoUrl",
    "gender",
    "age",
    "about",
    "skills",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditField.includes(field)
  );

  return isEditAllowed;
};

const validateNewPassword = (req) => {
  const newPassword = req.body.newPassword;
  if (validator.isStrongPassword(newPassword)) {
    return true;
  } else return false;
};

module.exports = {
  validateSignUpData,
  validateProfileEditData,
  validateNewPassword,
};
