const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

const instance = axios.create({
  baseURL: `${process.env.HOST_BACKEND}/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const main = async () => {
  instance.get("/user/search").then((res) => {
    let data = res.data.listEmail;
    let listEmail;
    if (data.length === 0) {
      return;
    } else {
      listEmail = data.map((user) => user.email);
    }

    listEmail.map(async (email) => {
      let cityResponse = await instance.get(`/user/get-city`, {
        params: {
          email: email,
        },
      });
      let city = cityResponse.data.city[0].city;
      let weatherResponse = await instance.get(`/weather-forecast/search`, {
        params: {
          city: city,
        },
      });
      let weather = weatherResponse.data;
      let html = `
        <h3>CQueue7 - Weather Forecast Center</h3>
        <h4>Weather today in ${city}</h4>
        <p>Temperature: ${weather.current.temp_c}°C</p>
        <p>Humidity: ${weather.current.humidity}%</p>
        <p>Wind speed: ${(weather.current.wind_mph * 0.44704).toFixed(
          2
        )}m/s</p>
      `;
      let info = await transporter.sendMail({
        from: process.env.EMAIL_SOURCE,
        to: email,
        subject: "Weather today ",
        html: html,
      });
      console.log("Message sent: %s", info.messageId);
    });
  });
};

main();
