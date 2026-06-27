```bash
git clone https://github.com/s0meth1ng2dr1nk/wisdom.git /opt/wisdom
cd /opt/wisdom
npm install
```

```bash
vi .env
# envs > wisdom > .env
```

```bash
cd /etc/systemd/system
ln -nfs /opt/wisdom/system/wisdom.service
systemctl daemon-reload
systemctl enable wisdom
systemctl start wisdom
```
