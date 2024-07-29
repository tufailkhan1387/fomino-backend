module.exports = loginData = (userData, accessToken, isGuest) => {
    return {
      status: "1",
      message: "Login successful",
      data: {
        userId: `${userData.id}`,
        firstName: `${userData.firstName}`,
        lastName: `${userData.lastName}`,
        email: `${userData.email}`,
        accessToken: `${accessToken}`,
        isGuest,
        joinedOn: userData.dataValues.joinedOn
          ? userData.dataValues.joinedOn
          : "2023",
        phoneNum: `${userData.countryCode} ${userData.phoneNum}`,
      },
      error: "",
    };
  };