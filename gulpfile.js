const gulp = require('gulp');
const gulpSSH = require('gulp-ssh');
const SSHConfig = require('ssh-config');
const path = require("path");
const fs = require("fs");
const childProcess = require("child_process");
const 転送先host = require("./gulpConfig.json").sshHost;
const 転送先ディレクトリ = require("./gulpConfig.json").targetDirectory;
if (転送先host == "" || 転送先ディレクトリ == "") {
  throw new Error(`gulpConfig.jsonの値がカラです。`);
}
const ssh = getSSHInstance();
gulp.task("deploy", async (done) => {
  await typescriptをコンパイル();
  await sshから一つのコマンドを実行(`rm -rf "${転送先ディレクトリ}" ; exit;\n`);
  await ファイルを転送();
  await sshから一つのコマンドを実行(`cd "${転送先ディレクトリ}" ; npm install --production; exit;\n`);
  done();
});
function ファイルを転送() {
  return new Promise((resolve, reject) => {
    gulp.src(['./**/*.*', '!**/node_modules/**', '!**/.vscode/**'])
      .pipe(ssh.dest(転送先ディレクトリ))
      .on("finish", () => { resolve(); });
  });
}
function sshから一つのコマンドを実行(command) {
  return new Promise(resolve => {
    const client = ssh.getClient();
    sshClientからshellのchannelを取得(client).then(channel => {
      // dataを受信しないとcloseが発火しない。何故・・・
      channel.on("data", (data) => {
        console.log(data.toString("utf-8"));
      });
      channel.on("close", () => {
        channel.end();
        client.end();
        resolve();
      });
      channel.end(command);
    });
  });
}
function sshClientからshellのchannelを取得(client) {
  return new Promise((resolve, reject) => {
    client.gulpReady(() => {
      client.shell((err, channel) => {
        if (err) {
          console.error(`sshのシェルを取得する事に失敗しました。`);
          reject(err);
        } else {
          resolve(channel);
        }
      });
    });
  });
}
function typescriptをコンパイル() {
  return new Promise((resolve, reject) => {
    console.log(`typescriptをコンパイル。`);
    const cp = childProcess.spawn(`node`, [`./node_modules/typescript/bin/tsc`]);
    cp.stderr.on("data", (data) => {
      console.error(data.toString("utf-8"));
    });
    cp.stdout.on("data", (data) => {
      console.log(data.toString("utf-8"));
    })
    cp.on("exit", (code) => {
      if (code !== 0) {
        console.error(`typescriptのコンパイルに失敗しました。`);
        reject();
      } else {
        resolve();
      }
    });
  });
}
function getSSHInstance() {
  if (process.platform !== "win32") {
    throw new Error('win32ではありません。');
  }
  const sshConfigPath = path.join(process.env["USERPROFILE"], ".ssh", "config");
  if (fs.existsSync(sshConfigPath) == false) {
    throw new Error('ssh_configがありません。');
  }
  const parseSshConfig = SSHConfig.parse(fs.readFileSync(sshConfigPath).toString("utf-8")).find({ Host: 転送先host });
  const port = parseSshConfig.config.filter(a => a.param === "Port").map(a => a.value).reduce((_, b) => b, null);
  const IdentityFile = parseSshConfig.config.filter(a => a.param === "IdentityFile").map(a => a.value).reduce((_, b) => b, null);
  const username = parseSshConfig.config.filter(a => a.param === "User").map(a => a.value).reduce((_, b) => b, null);
  return new gulpSSH({
    sshConfig: {
      host: 転送先host,
      port: port,
      username: username,
      privateKey: fs.readFileSync(IdentityFile).toString("utf-8")
    }
  });
}