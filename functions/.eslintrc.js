module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    // AQUI ESTÁ A MÁGICA: Atualizamos para 2020 para aceitar o código do Cursor
    ecmaVersion: 2020,
  },
  rules: {
    // Desligando o erro de Windows (CRLF)
    "linebreak-style": "off",
    // Desligando reclamação de aspas
    "quotes": "off",
    // Desligando reclamação de indentação
    "indent": "off",
    // Desligando reclamação de vírgula
    "comma-dangle": "off",
    // Desligando reclamação de tamanho de linha
    "max-len": "off",
    // Desligando reclamação de espaços
    "object-curly-spacing": "off",
    // Desligando exigência de comentários JSDoc
    "require-jsdoc": "off",
    // Permitindo console.log (senão ele reclama dos seus logs)
    "no-console": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};