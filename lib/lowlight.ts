// lib/lowlight.ts

// 1. IMPORT hàm tạo instance chính thức
import { createLowlight } from "lowlight"

// 2. Import các ngôn ngữ như bạn đã làm
import ts from "highlight.js/lib/languages/typescript"
import js from "highlight.js/lib/languages/javascript"
import json from "highlight.js/lib/languages/json"
import bash from "highlight.js/lib/languages/bash"
import xml from "highlight.js/lib/languages/xml"
import css from "highlight.js/lib/languages/css"

// 3. TẠO INSTANCE lowlight bằng cách gọi createLowlight()
const lowlight = createLowlight()

const languages = [
  { name: "ts", language: ts },
  { name: "typescript", language: ts },
  { name: "js", language: js },
  { name: "javascript", language: js },
  { name: "json", language: json },
  { name: "bash", language: bash },
  { name: "shell", language: bash },
  { name: "html", language: xml },
  { name: "xml", language: xml },
  { name: "css", language: css },
]

languages.forEach(({ name, language }) => {
  // 4. SỬ DỤNG lowlight.register(name, grammar) thay vì registerLanguage
  // Vẫn giữ check listLanguages() để tránh đăng ký trùng lặp (nếu cần)
  if (!lowlight.listLanguages().includes(name)) {
    lowlight.register(name, language) 
  }
})

export { lowlight }