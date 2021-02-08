FROM hayd/alpine-deno:1.5.2

WORKDIR /app

COPY app.ts .

RUN deno cache app.ts

# ------------------- Wire common -----------------
# create version file
ARG release_version=development
ENV RELEASE_FILE_PATH=/app/release.txt
RUN echo $release_version > $RELEASE_FILE_PATH
# /------------------ Wire common -----------------

ENV PORT=8080
EXPOSE $PORT

CMD ["run", "--allow-net","--allow-env", "app.ts"]
