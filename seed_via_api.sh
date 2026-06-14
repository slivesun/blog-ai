#!/bin/bash
# 通过 API 批量发布30篇博客
# 用法: bash seed_via_api.sh

API="http://120.26.209.105/api/v1/articles"
TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODE0MjIxMDMsInN1YiI6IjEiLCJ0eXBlIjoiYWNjZXNzIn0.vopkWl9o3jxe1GcQrHAc3W7uoXI_01CMeUiJFZT5GlU"

post_article() {
  local title="$1"
  local abstract="$2"
  local content="$3"
  local cat_id="$4"

  # 转义 JSON 中的特殊字符
  local body
  body=$(python3 -c "
import json, sys
print(json.dumps({
    'title': sys.argv[1],
    'abstract': sys.argv[2],
    'content': sys.argv[3],
    'category_id': int(sys.argv[4]),
    'is_draft': False
}, ensure_ascii=False))
" "$title" "$abstract" "$content" "$cat_id")

  local resp
  resp=$(curl -s -w "\n%{http_code}" -X POST "$API" \
    -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body" --insecure 2>/dev/null)

  local code
  code=$(echo "$resp" | tail -1)
  local body_resp
  body_resp=$(echo "$resp" | sed '$d')

  if [ "$code" = "201" ] || [ "$code" = "200" ]; then
    echo "[OK] $title"
  elif [ "$code" = "429" ]; then
    echo "[RATE] $title - 限流，等待15秒重试..."
    sleep 15
    resp=$(curl -s -w "\n%{http_code}" -X POST "$API" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$body" --insecure 2>/dev/null)
    code=$(echo "$resp" | tail -1)
    if [ "$code" = "201" ] || [ "$code" = "200" ]; then
      echo "[OK] $title (重试成功)"
    else
      echo "[FAIL] $title - HTTP $code"
    fi
  else
    echo "[FAIL] $title - HTTP $code"
  fi
}

echo "=== 批量发布30篇博客 ==="
echo ""

# Engineering (cat_id=1)
post_article "React 19 新特性：Server Components 实战" \
  "深入探索 React 19 Server Components 的实际应用场景和性能优势。" \
  "React 19 正式引入了 Server Components，这是一个革命性的特性，允许组件在服务器端渲染而不会增加客户端 bundle 大小。

Server Components 可以直接访问数据库、文件系统等服务器资源，无需通过 API 层。这意味着我们可以更简洁地获取数据，同时保持客户端的交互性。

在实际项目中，我们可以将页面分为 Server Components 和 Client Components。静态内容使用 Server Components 渲染，需要交互的部分使用 use client 标记为客户端组件。

性能测试表明，使用 Server Components 可以将首次加载时间减少 30-40%，同时显著降低 JavaScript bundle 大小。" 1

post_article "TypeScript 5.8 类型体操进阶指南" \
  "掌握 TypeScript 高级类型推导技巧，提升代码类型安全性。" \
  "TypeScript 的类型系统是图灵完备的，这意味着我们可以在类型层面实现复杂的逻辑。本文将介绍几个实用的高级类型技巧。

条件类型（Conditional Types）允许我们根据类型关系进行推导。例如 T extends U ? X : Y 可以根据 T 是否可赋值给 U 来选择不同的类型。

模板字面量类型（Template Literal Types）让我们可以在类型层面操作字符串。结合映射类型，可以实现自动化的 API 路由类型生成。

递归类型在处理深层嵌套数据结构时非常有用，比如深度只读（DeepReadonly）或深度可选（DeepPartial）的类型定义。" 1

post_article "Vite 6 构建优化：从开发到生产的全链路提速" \
  "通过配置优化和插件选择，将 Vite 项目构建速度提升 50% 以上。" \
  "Vite 6 带来了多项构建性能改进，但默认配置并不总是最优的。本文分享一些实战优化经验。

首先，确保使用 SWC 替代 Babel 作为转译器。在 vite.config.ts 中配置 @vitejs/plugin-react-swc 可以将开发启动速度提升 2-3 倍。

其次，合理配置依赖预构建。对于大型依赖如 lodash，使用 optimizeDeps.include 强制预构建，避免开发时的频繁重编译。

代码分割方面，使用 manualChunks 将 vendor 代码分离，并利用动态 import 实现路由级别的懒加载。配合 CDN 加速静态资源，可以将首屏加载时间控制在 1 秒以内。" 1

sleep 2

post_article "FastAPI 异步编程最佳实践" \
  "深入理解 Python 异步模型，避免常见的异步陷阱和性能瓶颈。" \
  "FastAPI 基于 Python 的 asyncio 构建，但很多开发者在使用异步时会犯一些常见错误。

第一个常见错误是在异步函数中使用同步阻塞操作。例如 time.sleep() 会阻塞整个事件循环，应该使用 await asyncio.sleep() 代替。

数据库操作也需要注意。虽然 SQLAlchemy 支持异步，但如果你使用的是同步 driver，在异步函数中执行数据库查询仍然会阻塞。解决方案是使用 run_in_executor 或切换到 asyncpg 等异步 driver。

对于 CPU 密集型任务，应该使用 asyncio.get_event_loop().run_in_executor() 将其放到线程池中执行，避免阻塞事件循环。" 1

post_article "Docker 多阶段构建实战：镜像瘦身 90%" \
  "通过多阶段构建和优化策略，将 Docker 镜像从 1.2GB 压缩到 120MB。" \
  "Docker 镜像过大是很多项目面临的问题。多阶段构建是解决这个问题的关键技术。

基本思路是将构建过程分为多个阶段：第一阶段使用完整的构建环境编译应用，第二阶段使用精简的基础镜像只复制编译产物。

以 Node.js 项目为例，第一阶段使用 node:20 安装依赖并构建，第二阶段使用 node:20-slim 只复制 dist 目录和 node_modules 中的生产依赖。

进一步优化可以使用 Alpine 基础镜像（node:20-alpine），配合 .dockerignore 排除不必要的文件。最终镜像可以从 1.2GB 压缩到 120MB，同时保持功能完整性。" 1

sleep 2

post_article "Git 工作流：从混乱到高效" \
  "建立清晰的 Git 分支策略和提交规范，提升团队协作效率。" \
  "很多团队在使用 Git 时缺乏统一的工作流规范，导致分支混乱、合并冲突频发。本文介绍一个经过验证的工作流方案。

采用 Git Flow 的简化版本：main 分支保持稳定可部署状态，feature 分支从 main 创建，完成后通过 PR 合并回 main。

提交信息遵循 Conventional Commits 规范：type(scope): description。常用的 type 包括 feat、fix、docs、style、refactor、test、chore。

配合 GitHub Actions 或 GitLab CI，在 PR 合并前自动运行 lint、test 和 build，确保代码质量。使用 husky 和 lint-staged 在本地提交时自动检查，将问题扼杀在萌芽阶段。" 1

post_article "" \
  "通过索引优化、查询重写和配置调优，解决 PostgreSQL PostgreSQL 查询优化：从慢查询到毫秒响应性能瓶颈。" \
  "PostgreSQL 是一个功能强大的关系型数据库，但不当的使用方式可能导致严重的性能问题。

索引是查询优化的核心。对于经常出现在 WHERE 子句中的列，创建 B-tree 索引。对于 JSONB 字段，使用 GIN 索引。对于地理空间数据，使用 GiST 索引。

EXPLAIN ANALYZE 是分析查询性能的利器。它显示查询执行计划和实际耗时，帮助我们识别全表扫描、嵌套循环等性能瓶颈。

连接池配置也很重要。使用 PgBouncer 或 SQLAlchemy 的连接池，避免频繁创建和销毁数据库连接。设置合理的 pool_size 和 max_overflow，平衡性能和资源消耗。" 1

sleep 2

post_article "CSS Container Queries：响应式设计的新纪元" \
  "告别 Media Queries 的局限，用 Container Queries 实现真正的组件级响应式。" \
  "CSS Container Queries 终于得到了主流浏览器的全面支持，这改变了我们构建响应式组件的方式。

传统的 Media Queries 基于视口宽度，无法感知组件所在容器的大小。这导致同一个组件在不同布局中可能表现不一致。

Container Queries 允许组件根据其父容器的大小来调整样式。使用 @container 规则，我们可以定义组件在不同容器宽度下的表现。

配合 CSS Subgrid，我们可以构建出真正独立、可复用的响应式组件库。每个组件自己管理响应式逻辑，不需要了解外部布局的细节。" 1

echo ""
echo "--- Engineering 完成，切换到 Design ---"
echo ""
sleep 3

# Design (cat_id=2)
post_article "设计系统中的间距体系：从 4px 网格到和谐布局" \
  "建立统一的间距规范，让设计和开发之间的协作更加顺畅。" \
  "间距是设计系统中最容易被忽视但又最重要的基础元素之一。一个良好的间距体系可以让界面看起来和谐统一。

采用 4px 基准网格是最常见的做法。所有间距值都是 4 的倍数：4、8、12、16、24、32、48、64。这保证了视觉上的一致性。

在 CSS 中，使用 CSS 自定义属性定义间距变量：--space-1: 4px、--space-2: 8px 等。在 Tailwind CSS 中，这些已经内置为 spacing scale。

间距的选择应该遵循内容层级原则：相关元素之间使用较小间距，不同区块之间使用较大间距。这帮助用户在视觉上理解内容的分组关系。" 2

post_article "深色模式设计指南：不只是换个背景色" \
  "深入探讨深色模式的设计原则，避免常见的设计陷阱。" \
  "深色模式不是简单地将背景色换成黑色，前景色换成白色。好的深色模式需要仔细考虑多个设计维度。

颜色选择上，深色背景不应该是纯黑 (#000000)，而是带有一点色调的深灰，如 #121212 或 #1a1a2e。这样可以减少眼睛疲劳，同时让彩色元素更加突出。

阴影在深色模式下几乎不可见，需要用边框或微妙的背景色差来创造层级感。例如，卡片可以使用比背景稍亮的底色，而不是阴影。

文字颜色也需要注意。纯白文字在深色背景上对比度太高，会造成视觉疲劳。使用 #e0e0e0 或 rgba(255,255,255,0.87) 更加舒适。" 2

post_article "微交互设计：让界面活起来" \
  "通过精心设计的微交互，提升产品的用户体验和情感连接。" \
  "微交互是产品中那些细小但重要的交互细节，它们让用户感受到产品的生命力和关怀。

按钮的 hover 效果是最基础的微交互。一个微妙的缩放（scale: 1.02）和颜色变化就能让用户感受到可点击性。使用 CSS transition 控制动画时长，200-300ms 是最佳范围。

加载状态的处理也很关键。骨架屏（Skeleton Screen）比传统的 loading spinner 更好，因为它预示了内容的结构，减少用户的等待焦虑。

状态转换动画应该遵循物理规律：使用 ease-out 作为进入动画的缓动函数，ease-in 作为退出动画。这符合物体在现实世界中的运动规律，让用户感觉更自然。" 2

sleep 2

post_article "字体配对的艺术：如何选择完美的字体组合" \
  "掌握字体配对的基本原则，为你的项目选择合适的字体组合。" \
  "字体选择对设计的整体感觉有着巨大的影响。一个好的字体组合可以让设计看起来专业而精致。

最基本的配对原则是对比：使用一个衬线字体（Serif）搭配一个无衬线字体（Sans-serif）。例如，标题使用 Playfair Display，正文使用 Inter。

字体的 x-height 应该相近，这样当它们放在一起时不会显得不协调。同时，注意字体的笔画粗细对比，太相似的字体会缺乏层次感。

Google Fonts 提供了大量免费字体和配对建议。常用的经典组合包括：Merriweather + Source Sans Pro、Lato + Raleway、Roboto + Roboto Slab。" 2

post_article "无障碍设计（A11y）：让所有人都能使用你的产品" \
  "从 WCAG 标准出发，系统性地提升产品的可访问性。" \
  "无障碍设计不仅是道德责任，在很多国家也是法律要求。WCAG 2.1 标准为 Web 无障碍提供了明确的指导。

颜色对比度是最基本的要求。普通文字需要至少 4.5:1 的对比度，大文字（18px 以上或 14px 加粗）需要至少 3:1。使用 WebAIM 的对比度检查器验证你的配色。

键盘可访问性同样重要。所有交互元素都应该可以通过 Tab 键访问，使用 Enter 或 Space 键激活。确保焦点指示器（focus indicator）清晰可见。

为图片添加 alt 属性，为表单元素关联 label，使用语义化 HTML 标签（nav、main、article、aside）。这些简单的行为可以大幅提升屏幕阅读器用户的体验。" 2

sleep 2

post_article "Figma 自动布局进阶：构建自适应组件" \
  "深入掌握 Figma Auto Layout 的高级技巧，提升设计效率。" \
  "Figma 的 Auto Layout 是构建可维护设计系统的核心功能。掌握它的高级用法可以大幅提升设计效率。

嵌套 Auto Layout 允许我们构建复杂的组件结构。例如，一个卡片组件可以包含标题、内容和操作栏三个 Auto Layout 帧，每个帧有自己的布局方向和间距。

使用 Fill Container 和 Hug Contents 的组合，可以让组件在不同尺寸下自动适应。按钮文字变化时自动伸缩，容器内容增多时自动换行。

配合 Variables 功能，可以在一个组件中定义多个变体，通过切换变量值快速切换状态。例如，一个按钮组件可以通过变量控制大小、颜色和禁用状态。" 2

post_article "响应式图片策略：在每个设备上都完美呈现" \
  "选择合适的响应式图片方案，平衡图片质量和加载性能。" \
  "在多设备时代，图片需要在从手机到 4K 显示器的各种屏幕上都表现良好。响应式图片是解决这个问题的关键。

使用 picture 元素和 srcset 属性，可以根据设备的像素密度和视口宽度提供不同尺寸的图片。配合 sizes 属性，浏览器可以自动选择最合适的图片。

WebP 和 AVIF 格式可以大幅减少图片文件大小。使用 picture 元素同时提供新格式和 fallback，确保兼容性。

懒加载（Lazy Loading）是另一个重要的优化手段。使用 loading=lazy 属性，让浏览器在图片进入视口时才开始加载，减少首屏加载时间。" 2

echo ""
echo "--- Design 完成，切换到 Security ---"
echo ""
sleep 3

# Security (cat_id=3)
post_article "OWASP Top 10 2025：Web 安全新威胁" \
  "了解最新的 OWASP Top 10 安全风险，保护你的 Web 应用免受攻击。" \
  "OWASP Top 10 是 Web 应用安全最重要的参考标准。2025 年的更新反映了当前的安全态势。

注入攻击（Injection）仍然位居前列。SQL 注入、NoSQL 注入和命令注入都是常见的攻击向量。使用参数化查询和 ORM 是最有效的防御手段。

身份认证失效（Broken Authentication）包括弱密码策略、会话管理和多因素认证缺失等问题。实施严格的密码策略、使用 JWT 或 session tokens、启用 MFA 可以显著提升安全性。

敏感数据暴露（Sensitive Data Exposure）要求我们对敏感数据进行加密存储和传输。使用 HTTPS、加密敏感字段、避免在日志中记录敏感信息是基本要求。" 3

post_article "JWT 安全最佳实践：避免常见的 Token 陷阱" \
  "正确使用 JWT，避免安全漏洞和常见的实现错误。" \
  "JWT（JSON Web Token）是现代 Web 应用中最常用的身份认证方案之一，但不正确的使用方式会带来严重安全风险。

首先，永远不要在 JWT 的 payload 中存储敏感信息。虽然 JWT 是编码的（Base64），但它不是加密的。任何人都可以解码 payload 查看内容。

其次，使用强密钥签名。HS256 算法需要至少 256 位的密钥。更好的选择是使用 RS256 或 ES256 非对称算法，这样即使密钥泄露，攻击者也无法伪造 token。

设置合理的过期时间。Access Token 应该短命（15-30 分钟），Refresh Token 可以较长（7-30 天）。使用黑名单机制处理 token 撤销场景。" 3

post_article "HTTPS 配置完全指南：从证书申请到安全加固" \
  "一步步配置安全的 HTTPS，包括 HSTS、证书透明度和 OCSP Stapling。" \
  "HTTPS 是现代 Web 安全的基础。正确配置 HTTPS 不仅仅是安装证书那么简单。

使用 Let's Encrypt 可以免费获取证书。配合 Certbot 自动化工具，可以实现证书的自动申请和续期。对于生产环境，建议使用 Nginx 或 Apache 的反向代理来处理 SSL 终止。

启用 HSTS（HTTP Strict Transport Security）告诉浏览器始终使用 HTTPS 访问你的站点。设置 Strict-Transport-Security: max-age=31536000; includeSubDomains; preload 可以防止 SSL 剥离攻击。

OCSP Stapling 可以加速证书验证过程。启用后，服务器会缓存 OCSP 响应，客户端不需要单独联系 CA 服务器验证证书状态。" 3

sleep 2

post_article "API 安全防护：限流、认证与输入验证" \
  "构建安全的 API 防护体系，抵御常见的 API 攻击。" \
  "API 是现代应用的核心，也是攻击者的主要目标。建立完善的 API 安全防护体系至关重要。

限流（Rate Limiting）是防护 DDoS 和暴力破解的第一道防线。使用令牌桶或滑动窗口算法，对不同类型的 API 设置不同的限流策略。认证接口应该更严格（如 5次/分钟），普通读取接口可以宽松一些。

输入验证是防止注入攻击的关键。使用 Pydantic 等库进行严格的输入验证，确保数据类型、长度和格式符合预期。对 SQL 查询使用参数化，对 HTML 输出进行转义。

CORS 配置也需要谨慎。不要使用 allow_origins=*，而是明确指定允许的来源域名。限制允许的 HTTP 方法和请求头，减少攻击面。" 3

post_article "密码安全：从哈希到盐值的完整方案" \
  "了解密码存储的安全最佳实践，保护用户凭证安全。" \
  "密码安全是身份认证系统的基础。不正确的密码存储方式可能导致大规模数据泄露后的灾难性后果。

永远不要以明文存储密码。使用专门的密码哈希算法，如 bcrypt、scrypt 或 Argon2。这些算法内置了盐值生成和工作因子，可以有效抵御彩虹表攻击和暴力破解。

bcrypt 是最广泛使用的密码哈希算法。它的工作因子（cost factor）可以调整，随着计算能力的提升而增加。推荐使用 cost=12 作为起始值。

密码策略应该要求至少 8 个字符，包含大小写字母、数字和特殊字符。但更重要的是检查常用密码列表（如 Have I Been Pwned 的数据集），拒绝使用已泄露密码的用户。" 3

sleep 2

post_article "XSS 防护：前端安全的重中之重" \
  "全面了解跨站脚本攻击的类型和防御策略。" \
  "跨站脚本攻击（XSS）是最常见的 Web 安全漏洞之一。攻击者通过注入恶意脚本，窃取用户凭证或执行未授权操作。

存储型 XSS 是最危险的类型。攻击者将恶意脚本存储在数据库中，当其他用户访问包含该内容的页面时，脚本会在他们的浏览器中执行。防御方法是对所有用户输入进行 HTML 转义。

反射型 XSS 通过 URL 参数注入恶意脚本。服务器将未经过滤的参数直接嵌入到响应中。使用 Content Security Policy（CSP）可以有效防止这类攻击。

DOM 型 XSS 在客户端 JavaScript 中发生。使用 innerHTML 插入未经过滤的内容是常见的触发点。使用 textContent 替代 innerHTML，或使用 DOMPurify 等库进行消毒。" 3

post_article "CORS 深度理解：跨域请求的安全边界" \
  "彻底理解 CORS 的工作原理，正确配置跨域访问策略。" \
  "CORS（跨域资源共享）是浏览器的同源策略的安全扩展。正确理解 CORS 对于构建安全的 Web API 至关重要。

同源策略禁止从一个源（域名、协议、端口）访问另一个源的资源。CORS 通过 HTTP 头部允许服务器声明哪些源可以访问它的资源。

预检请求（Preflight Request）是 CORS 的重要机制。对于非简单请求（如带有自定义头部的 PUT/DELETE 请求），浏览器会先发送 OPTIONS 请求询问服务器是否允许。

配置 CORS 时，应该明确指定允许的来源，而不是使用通配符。限制允许的 HTTP 方法和请求头。对于需要携带凭证的请求，不能使用 Access-Control-Allow-Origin: *。" 3

post_article "依赖安全：防范供应链攻击" \
  "建立依赖管理的安全策略，防止恶意包注入和漏洞利用。" \
  "供应链攻击是近年来增长最快的安全威胁之一。攻击者通过污染开源依赖包来入侵使用这些包的项目。

定期审计依赖是基本的安全实践。使用 npm audit、pip-audit 等工具检查已知漏洞。将审计步骤加入 CI/CD 流程，在每次构建时自动检查。

锁定依赖版本。使用 package-lock.json 或 requirements.txt 精确指定依赖版本，避免自动升级到包含恶意代码的版本。

对于关键项目，考虑使用私有包仓库（如 Verdaccio 或 Nexus）。只允许从受信任的源安装依赖。使用 SRI（Subresource Integrity）验证 CDN 资源的完整性。" 3

echo ""
echo "--- Security 完成，切换到 Systems ---"
echo ""
sleep 3

# Systems (cat_id=4)
post_article "微服务架构的陷阱：何时不该使用微服务" \
  "了解微服务架构的适用场景和常见误区，做出正确的架构决策。" \
  "微服务架构不是银弹。在很多情况下，单体架构反而是更好的选择。

微服务的主要优势在于独立部署、技术栈多样性和团队自治。但这些优势只有在团队规模足够大（通常超过 20 人）和系统复杂度足够高时才能体现。

微服务带来的挑战包括：分布式系统的复杂性（网络延迟、部分失败、数据一致性）、服务间通信的开销、部署和监控的复杂度。这些挑战需要成熟的技术团队和完善的基础设施来应对。

对于初创公司或小型团队，建议从单体架构开始。当系统增长到一定规模，出现明确的团队边界和技术异构需求时，再逐步拆分为微服务。这种演进式的架构策略比一开始就采用微服务更加务实。" 4

post_article "Redis 缓存策略：从入门到精通" \
  "掌握 Redis 的核心数据结构和缓存模式，提升系统性能。" \
  "Redis 是最流行的内存数据库，广泛用于缓存、会话存储和消息队列。掌握正确的缓存策略可以大幅提升系统性能。

缓存穿透是指查询不存在的数据，导致请求直接打到数据库。解决方案是使用布隆过滤器（Bloom Filter）预判断数据是否存在，或者缓存空值。

缓存雪崩是指大量缓存同时失效，导致数据库瞬间压力过大。解决方案是给缓存过期时间添加随机偏移量，避免同时失效。

缓存击穿是指热点数据失效时，大量并发请求同时打到数据库。使用互斥锁（Mutex Lock）或永不过期策略配合后台异步更新来解决。

Redis 的数据结构选择也很关键。String 适合简单键值，Hash 适合对象存储，List 适合队列，Set 适合去重，Sorted Set 适合排行榜。" 4

post_article "Docker Compose 编排实战：一键部署完整开发环境" \
  "使用 Docker Compose 编排多容器应用，实现开发环境的标准化。" \
  "Docker Compose 是定义和运行多容器应用的利器。通过一个 YAML 文件，可以描述整个应用的服务架构。

一个典型的 Web 应用栈包括：Web 服务器（Nginx）、应用服务器（Node.js/Python）、数据库（PostgreSQL）和缓存（Redis）。使用 Docker Compose 可以一键启动所有服务。

服务间通信使用 Docker 网络。Compose 自动创建默认网络，服务可以通过服务名互相访问。例如，应用服务器可以使用 db 作为主机名连接数据库。

数据持久化使用 volumes。将数据库数据目录挂载到宿主机，避免容器重建时数据丢失。使用 named volumes 比 bind mounts 更易于管理。

环境变量管理使用 .env 文件和 environment 配置。敏感信息（如数据库密码）通过 .env 文件注入，不写入代码仓库。" 4

sleep 2

post_article "Nginx 配置进阶：性能优化与安全加固" \
  "深入 Nginx 配置，实现高性能反向代理和安全防护。" \
  "Nginx 是最流行的 Web 服务器和反向代理。合理的配置可以显著提升性能和安全性。

启用 Gzip 压缩可以减少传输数据量。配置 gzip on、gzip_types 指定需要压缩的 MIME 类型、gzip_min_length 设置最小压缩阈值。注意不要压缩已经压缩的格式（如图片）。

连接优化包括：keepalive_timeout 设置长连接超时、worker_connections 调整每个 worker 的最大连接数、proxy_buffer_size 优化代理缓冲区。

安全配置包括：隐藏 Nginx 版本号（server_tokens off）、添加安全响应头（X-Frame-Options、X-Content-Type-Options、CSP）、限制请求体大小（client_max_body_size）。

SSL 配置使用 TLS 1.2+，禁用不安全的加密套件。启用 OCSP Stapling 和 HSTS。使用 SSL Labs 测试工具验证配置。" 4

post_article "日志系统设计：从混乱到可观测" \
  "构建结构化日志系统，实现高效的故障排查和系统监控。" \
  "良好的日志系统是运维和故障排查的基础。结构化日志比纯文本日志更易于分析和检索。

使用 JSON 格式记录日志。每条日志包含时间戳、日志级别、请求 ID、用户 ID、操作类型、耗时等字段。Loguru、structlog 等库可以简化结构化日志的实现。

日志级别应该合理使用：DEBUG 用于开发调试、INFO 用于正常操作记录、WARNING 用于潜在问题、ERROR 用于错误但不影响系统运行、CRITICAL 用于致命错误。

集中式日志收集使用 ELK Stack（Elasticsearch + Logstash + Kibana）或 Grafana Loki。将所有服务的日志汇聚到一个平台，方便跨服务关联分析。

日志轮转和清理策略同样重要。使用 logrotate 或应用内置的日志轮转功能，按大小或时间切割日志文件，定期清理过期日志。" 4

sleep 2

post_article "CI/CD 流水线设计：从提交到部署的自动化" \
  "设计高效的 CI/CD 流水线，实现代码变更的自动验证和部署。" \
  "CI/CD 是现代软件开发的核心实践。一个好的流水线可以大幅提升开发效率和代码质量。

CI（持续集成）阶段包括：代码检出、依赖安装、代码检查（lint）、单元测试、构建。每个步骤失败都应该阻断流水线，防止问题代码合并。

CD（持续部署）阶段包括：构建 Docker 镜像、推送到镜像仓库、部署到测试环境、集成测试、部署到生产环境。使用蓝绿部署或金丝雀发布策略降低部署风险。

GitHub Actions 和 GitLab CI 是最常用的 CI/CD 平台。使用 YAML 文件定义流水线步骤，支持缓存依赖、并行执行和矩阵构建。

安全扫描应该集成到流水线中：依赖漏洞扫描（Dependabot/Snyk）、代码安全分析（SonarQube）、容器镜像扫描（Trivy）。发现问题自动阻断合并。" 4

post_article "消息队列选型：Kafka vs RabbitMQ vs Redis Streams" \
  "对比主流消息队列方案，根据业务场景选择合适的技术。" \
  "消息队列是分布式系统中解耦和异步处理的核心组件。不同场景需要不同的消息队列方案。

Kafka 适合高吞吐量的流处理场景。它的分区机制支持水平扩展，持久化存储支持消息回溯。适合日志收集、事件溯源和实时数据管道。

RabbitMQ 适合传统的任务队列和 RPC 场景。它支持复杂的路由规则（Exchange/Binding）、消息确认和死信队列。适合需要精确控制消息投递的业务场景。

Redis Streams 是 Redis 5.0 引入的消息队列功能。它结合了 Redis 的高性能和消息队列的特性。适合轻量级的异步处理和事件通知。

选择消息队列时需要考虑：吞吐量要求、消息持久化需求、消息顺序保证、消费者组支持、运维复杂度和团队熟悉程度。" 4

echo ""
echo "=== 全部30篇发布完成 ==="
