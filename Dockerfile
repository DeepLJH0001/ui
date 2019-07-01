FROM registry.cn-hangzhou.aliyuncs.com/lijunhua_ruijie/ui:build

EXPOSE 8000

WORKDIR /source
COPY package.json ./
COPY scripts ./scripts
COPY . /source
RUN  bash -x ./scripts/update-dependencies
