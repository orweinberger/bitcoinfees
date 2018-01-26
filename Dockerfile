FROM node:8-alpine

MAINTAINER Itay Weinberger "orweinberger@gmail.com"

COPY . /opt/bitparse

RUN \
  cd /opt/bitparse && \
  npm install

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Environment
ENV NODE_ENV=production

# Entrypoint
WORKDIR /opt/bitparse
CMD ["dumb-init", "node", "index.js"]