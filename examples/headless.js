async function main(){
   await fetch(
        "https://cors-anywhere.herokuapp.com/https://www.sandbox.paypal.com/graphql?GetApplepayConfig",
        {
          method: "POST",
          // credentials: "include",
          // mode: "no-cors", // no-cors, *cors, same-origin
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            query: `
          query GetApplepayConfig(
            $buyerCountry: CountryCodes!
            $clientId: String!
            $merchantId: [String]!
          ) {
            applepayConfig(
              buyerCountry: $buyerCountry
              clientId: $clientId
              merchantId: $merchantId
            ) {
              merchantCountry,
              supportedNetworks
            }
          }`,
            variables: {
              buyerCountry: "US",
              clientId:
                "AdVrVyh_UduEct9CWFHsaHRXKVxbnCDleEJdVOZdb52qSjrWkKDNd6E1CNvd5BvNrGSsXzgQ238dGgZ4",
              merchantId: ["2V9L63AM2BYKC"]
            }
          })
        }
      )
        .then((res) => res.json())
        .then(console.log)
        .catch(console.error);
      
}

main()
.catch(console.error)