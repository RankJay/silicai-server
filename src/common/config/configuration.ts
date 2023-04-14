export default () => ({
  microservicePort: parseInt(process.env.MICROSERVICE_PORT, 10),
  port: parseInt(process.env.PORT, 10),
});
