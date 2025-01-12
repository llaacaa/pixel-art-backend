import mongoose from "mongoose";

function mongoConnect() {
    mongoose
    .connect(process.env.MONGODB_URL || "")
    .then(() => {
        console.log("Connected to MongoDB successfully");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });
};

export default mongoConnect;