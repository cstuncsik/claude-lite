/** @type {import("jest").Config} **/
export default {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json"
      }
    ]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(react-markdown|remark-gfm|remark-parse|remark-rehype|rehype-stringify|unified|unist-.+|vfile-.+|mdast-util-.+|micromark-.+|decode-named-character-reference|character-entities|ccount|comma-separated-tokens|hast-util-.+|html-url-attributes|property-information|space-separated-tokens|string-length|strip-markdown|trough|zwitch)/)"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: [
    "**/__tests__/**/*.(j|t)s?(x)",
    "**/?(*.)+(spec|test).(j|t)s?(x)"
  ],
};