export const logAxiosError = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    if ("response" in error) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { response } = error as { response: unknown };
      if (typeof response === "object" && response != null) {
        if ("data" in response) {
          console.log(response?.data);
        }
        if ("status" in response) {
          console.log(response?.status);
        }
        if ("headers" in response) {
          console.log(response?.headers);
        }
      }
    } else if ("request" in error) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else if ("message" in error) {
      // Something happened in setting up the request that triggered an Error
      console.log("Error", error.message);
    }
    if ("config" in error) {
      console.log(error.config);
    }
  } else {
    console.log(error);
  }
};

