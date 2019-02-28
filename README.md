# 🛠️ firebase-admin-node

> 更新自 6.5.1
>
> https://github.com/firebase/firebase-admin-node/tree/2952450c48cfc71319bb32e0cd701195e1012f38
>
> 參考
>
> https://github.com/leaniterationsllc/firebase-admin-node/commit/98bfee9f9d3d5922f29b62a1b1cda01a4a71ef81


## Why?

因為 NOW v2 Lambda 的 size 越少越好，所以這邊做的是輕量化的處理

分兩個 branch


- **auth**: 只保留 auth。
- **database**: 只保留 auth 和 database。


## How to use

auth only


```
yarn add now-firebase-admin-auth
```

auth and database


```
yarn add now-firebase-admin-database
```

