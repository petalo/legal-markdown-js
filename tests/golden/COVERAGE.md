| Feature                                                    | Fixture(s)             | Status |
| ---------------------------------------------------------- | ---------------------- | ------ |
| Noop passthrough                                           | 00                     | ✅     |
| Basic imports (single/multiple)                            | 01, 02                 | ✅     |
| Mixins in headers and text                                 | 10                     | ✅     |
| Optional clauses (with/without substitutions)              | 12, 13, 14             | ✅     |
| Header numbering (basic/no-indent/no-reset/leader types)   | 20, 21, 25, 30         | ✅     |
| Headers with cross-references                              | 36                     | ✅     |
| Combined headers + mixins + clauses                        | 40, 42                 | ✅     |
| Frontmatter import merge (single/nested/conflicts/types)   | 50, 51, 52, 53, 54, 55 | ✅     |
| Force commands passthrough and behavior                    | 56, 57                 | ✅     |
| Frontmatter dates and reserved fields                      | 60, 61                 | ✅     |
| Signature lines and date token processing                  | 62, 63                 | ✅     |
| Template loops and body cross-references                   | 64, 65                 | ✅     |
| Mixed feature combo and large document stress              | 66, 67                 | ✅     |
| Circular imports and deep import chains                    | 70, 71, 72             | ✅     |
| Header defaults with and without YAML + mixins             | 80, 81, 82             | ✅     |
| UTF-8 BOM at start of document                             | 83                     | ✅     |
| Malformed YAML graceful error (expected failure path)      | 84                     | ✅     |
| Empty document passthrough                                 | 85                     | ✅     |
| Unicode variable names and non-ASCII values                | 86                     | ✅     |
| All nine header levels                                     | 87                     | ✅     |
| Real-world mutual NDA document                             | 90                     | ✅     |
| Real-world employment contract with imports and cross-refs | 91                     | ✅     |
| String helper documentation fixture                        | 92                     | ✅     |
| Number helper documentation fixture                        | 93                     | ✅     |
| Date helper documentation fixture                          | 94                     | ✅     |
| Math helper documentation fixture                          | 95                     | ✅     |
| Comparison and logical helper fixture                      | 96                     | ✅     |
| Combined helper-driven mutual NDA fixture                  | 97                     | ✅     |
| Full integration-style golden scenario                     | 99                     | ✅     |
