FROM debian:stretch AS local
RUN apt-get update -y && apt-get install -y curl gnupg git
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
ENTRYPOINT [ "npm", "start" ]
