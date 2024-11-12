import mongoose, { ConnectOptions } from "mongoose";
const connectDB = (url: string) => {
  const options: ConnectOptions = {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  };
  return mongoose.connect(url, options);
};

export default connectDB;
