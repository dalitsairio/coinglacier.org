FROM node:8
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install -g gulp@4.0.0
RUN npm install --only=dev

CMD ["gulp"]