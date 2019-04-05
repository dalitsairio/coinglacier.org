FROM node:8
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install -g gulp
RUN npm install --only=dev

CMD ["gulp"]