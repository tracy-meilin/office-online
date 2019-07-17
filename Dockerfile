FROM registry.101.com/nodejs/node:8.12.0
ADD . /app/
EXPOSE 8080
CMD ["node", "/app/index.js"]
