FROM node:18

WORKDIR /app

# Copy entire project
COPY .. .

RUN npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]