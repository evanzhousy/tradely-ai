# Tradely：从 AI 反馈到持续练习的代码改动计划

状态：待实施。本计划承接已经实现的三课 AI 教练，不重做 V1，也不表示新功能已上线。

代码基线：`0e61474`（2026-09-09），工作区核对时干净。V1 的实现与待完成发布条件见 [AI-COACH.md](../AI-COACH.md) 和 [验证记录](../reviews/ai-coach-verification-2026-09-09.md)。本次交付是下一阶段计划，未修改应用代码、安装依赖、运行模型或迁移数据库。

## 1. 目标、顺序与设计声明

下一阶段的用户体验：**看懂反馈所指的证据 → 完成当前独立案例 → 得到一项针对性练习 → 看见不同案例中的进步 → 知道下次练什么。**

**设计声明：版本化课程与案例库拥有事实和评分标准；练习服务拥有案例分配、曝光和不可变结果；推荐与能力进度由这些记录推导；AI 提供形成性建议，视觉组件只解释同一份证据。**

优先顺序：

1. **P0：补齐 V1 真实反馈与两轮修订的评估能力。**
2. **P1：建立五项技能、可信作答证据及追加练习案例库。**
3. **P2：上线“接下来练这一项”和可恢复的短练习。**
4. **P3：让反馈定位到具体证据，提供“在题目中查看”。**
5. **P4：展示跨案例进步和到期复习建议。**

P1–P4 可以在本地使用固定测试反馈推进，不依赖已经配好模型凭据。AI 面向真实用户开放仍需通过 P0 和 V1 的发布条件。先完成 `rank-symbols / fair-comparison` 的纵向切片，再扩展五项技能和完整案例库。

当前发布范围仍围绕 `audited-boundary`、`rank-symbols`、`rank-contracts`。本轮采用有据可查的规则推荐；不引入强化学习、自动生成整套金融课程、独立的聊天产品或新的付费方案。研究答辩模拟列为后续阶段，见第 12 节。

## 2. 研究到产品与代码的映射

以下是对产品方式的借鉴，不能视为 Tradely 学习效果或商业回报的证明。

| 参考 | 借鉴点 | 本计划对应改动 |
| --- | --- | --- |
| [Brilliant / Koji](https://brilliant.org/help/features/how-does-koji-work/) | 教练理解并指向交互题目 | 为反馈引用提供有上下文校验的证据定位，优先 2D |
| [DataCamp Practice](https://support.datacamp.com/hc/en-us/articles/28562143877015-DataCamp-Practice-Reinforce-Your-Learning-with-Hands-On-Exercises) | 从所学内容接续短练习 | 课程完成后推荐一项 3–5 分钟的练习 |
| [Educative](https://www.educative.io/blog/launch-coding-career-ai-mock-interviews) | 反馈连接到下一项需要练习的能力 | 将可解释的错误或建议映射到技能与案例 |
| [ALEKS](https://www.aleks.com/about_aleks/)、[CENTURY](https://support.century.tech/support/solutions/articles/44002544210-the-recommended-path-rp-) | 诊断、练习和知识状态连接 | 用多次有出处的作答记录推导能力进度 |
| [Coursera](https://www.coursera.org/enterprise/immersive-learning) | 明确角色、目标和结果的模拟 | 后续研究答辩；先验证当前短练习的效果 |
| [Speak](https://help.speak.com/en/articles/5358417-what-s-the-difference-between-premium-and-premium-plus) | 持续个性化成为付费价值 | 先验证针对性练习的回访，再决定长期 AI 权益 |

## 3. 当前代码决定了哪些边界

| 已核对的事实 | 处理决定 |
| --- | --- |
| `coachingFeedbackSchema` 已有 `gaps[].criterionId` 和 `referenceIds` | 复用这些线索，不让模型直接输出任意练习 ID、解锁动作或能力等级 |
| `CoachingFeedback` 的引用按钮目前展开文字；`CoachingReference` 只有 `id/label/text` | 增加向后兼容的展示信息和逻辑定位目标，旧反馈继续展开文字 |
| `lesson_attempt` 每用户每课只允许一个进行中的记录；`openLearning(restart)` 会恢复当前记录 | 追加练习使用独立记录，不能借用 restart、伪造课 ID 或终止正在进行的课程 |
| 已提交 `assessment` 保存的是汇总结果，没有持久化逐题技能证据 | 新提交增加不可变的逐项结果快照；不按今天的 rubric 重算历史记录 |
| 当前每课两个 practice 变体，evaluation 变体不进运行时 | 新建经过审核的追加练习库，保留原课的独立案例和离线评估集 |
| `engine.ts` 已提供 transition、逐项检查和 assessment | 复用评分内核，为短练习建立单独持久化适配层，不复制评分逻辑 |
| `lesson_progress` 只代表课程完成和播放位置 | 技能面板使用独立 DTO，不改课程百分比的含义 |
| `ContractExplorer` 与 `NeighborhoodComparison` 持有本地选择、切片、回放和相机状态 | 初版证据定位不强行控制或重置这些状态；不能定位时显示原快照 |
| `getCoachingSettings()` 同时检查 cohort、模型、key 和总开关 | 抽出名单判定，追加练习不能因为 AI key 缺失或模型暂停而失效 |
| `evaluate-coaching.ts` 当前真实执行分支只跑 initial 轮 | P0 增加双轮测试，而不是把 90 条初轮样例当作两轮质量证明 |
| `lesson_coach_revision_saved` 当前在第二轮 review 分支发出 | 保留历史语义；新定义真实修订事件，完成指标以成功的修订结果为准 |
| 分析 URL 目前去掉 query/hash，但保留 pathname | 新的私有练习 UUID 路由必须归一化，防止进入 page/referrer/replay URL |

## 4. P0：先建立可用的反馈质量与测量基线

修改：

- `apps/web/scripts/evaluate-coaching.ts`、`coaching-fixtures.ts`：保留现有 60 开发/30 验收初轮样例；增加 12 组双轮轨迹（三课 × 真正修正/表面改写 × 中英文）。第二轮只得到同案例的原理由、第一轮反馈与修订理由，不带验收标签。
- 新增 `apps/web/scripts/review-coaching-evaluation.ts`：校验人工评审结果并输出摘要。记录事实错误、错误肯定、证据引用、主要缺口、追问可回答性和修订识别；未评审项目显示待评审，不默认通过。
- `analytics/events.ts`、`features/learning/coaching-panel.tsx` 及相关 tests：新增 `lesson_coach_revision_committed`，仅在确实保存了不同的理由/答案后发出，按会话及保存版本去重。额外理由和原题文字回答两条保存路径都覆盖。旧 `revision_saved` 事件不静默改义，文档注明其限制。
- `docs/AI-COACH.md`、`docs/ANALYTICS-SCENARIOS.md`：定义“完成两轮辅导”为 revision generation 成功且输入发生有意义变化；数据库的 generation/session 是完成真相，前端事件仅说明被看到或被操作。

保留每次生成的 ID、输入、版本、输出及实际用量；评估输出只保存在现有忽略目录中。模型费用上限按双轮重新预估，未知执行结果不自动重发。不用另一个模型给教学质量自动盖章。

P0 面向真实用户的开放门槛：独立验收和双轮样例经人工复核，没有严重事实错误、未来案例泄漏或错误掌握认证；反馈正确且具体的比例、样本数、耗时、成本都有记录。缺少凭据时完成本地评估工具与测试，保留真实评估为未通过的发布门槛。

## 5. P1：五项技能、不可变证据和案例库

### 5.1 一个明确的技能目录

新增 `apps/web/src/content/learning-skills.ts`：公开的稳定 ID、中英文名称和能力定义。

| skillId | 学习者看到的能力 | 现有 coaching criterion 线索 |
| --- | --- | --- |
| `units-and-calculations` | 数量、单位与计算 | 从未来保存的客观题检查获得，不从任意文字关键词猜测 |
| `scope-and-time` | 范围与时间一致性 | `scope` |
| `fair-comparison` | 使用公平的比较依据 | `comparison`、`fixed-grid` |
| `claim-limits` | 区分证据与推断 | `claim-boundary` |
| `invalidation` | 找到反证和失效条件 | `invalidation` |

新增 `content/practice/skill-mapping.server.ts`，拥有“场景版本/题目 ID/技能”的明确映射。原有题目不必全都强行归入这五项技能，例如未映射的 moneyness 题仍按原课程评分。AI gap 只是推荐线索，不能生成客观失败或成功记录。

### 5.2 为今后的正式提交保存逐项结果

- 在 `lesson_attempt` 增加 nullable `assessment_details` JSONB 列，以及 nullable `independent_presented_at` 时间列。进入独立阶段的现有原子更新在返回题目前首次写入该时间；不把练习创建时间当成独立题曝光时间。
- 修改 `server/learning.server.ts` 的最终提交分支，在同一个 revision 条件更新中写入逐项快照：questionId、skillId、met、reviewRequired、独立阶段 hint 使用、caseKey、caseFamilyId、评分/映射版本和展示所需的原始逐项反馈。
- 逐项结果复用 `evaluateStep()`；原 `assessment` 结构、`practiced/demonstrated` 和历史提交保持原义。
- 老记录的新列为空，显示“缺少可用于技能判断的逐项证据”。不通过重新执行当前 rubric 给旧成绩补造明细；旧记录的曝光不确定时保守标为已见/未知，不能把它当作新题。
- 不把整个 attempt 的 `practiced` 当作所有技能不合格：它也可能源于未复核文字题或提示使用。

### 5.3 追加练习库

新增 `content/practice/catalog.server.ts` 与三个 owner lesson 的案例文件。最初正式范围为 **30 个在线案例**：五项技能各六个，覆盖至少三个结构不同的 case family；另保留六个离线验收案例，不进入运行时目录。

每个案例包含：`caseId`、`version`、`ownerLessonId`、`primarySkillId`、`caseFamilyId`、`exposureKey`、difficulty、预计时间、中英文材料、允许证据、题目、评分标准和解释。每个短练习围绕一个目标，包含 1–3 个响应，通常 3–5 分钟完成。

- `ownerLessonId` 决定课程访问，必须是实际已有课程。
- family 描述推理任务的结构，例如同组变化、基准不匹配、等总量不同广度；它不是随机题号。
- exposureKey 标识实质相同的题目。改语言、换名字、修正排版或只做装饰性变化不能制造“新案例”。content hash 用于检查材料变化，不能单独证明学习迁移。
- 数值、单位、缺失信息和正确答案由受测试的案例定义决定。AI 可以在离线创作时协助起草，运行时不即时生成用于能力判断的金融事实或答案。
- 保存旧案例版本，使已提交结果与旧作品可解释；退休案例停止新分配。答案含义或材料实质变化需要版本升级。

先用 `fair-comparison` 的三类案例完成纵向切片：相对量比较、基准缺失/不匹配、同组变化导致排名变化。通过后再完成全库。

## 6. P2：追加练习与“接下来练这一项”

### 6.1 记录模型：新增一张 practice_attempt

`practice_attempt` 的建议字段：

- `id`、`user_id`（账户删除级联）、`owner_lesson_id`。
- `case_id/version`、`case_family_id`、`exposure_key`、`content_hash`、技能/评分版本。
- 可空的 `source_lesson_attempt_id`、`source_coaching_session_id` 与固定 `selection_reason_code`，不复制 AI 的原始 gap 文本。引用必须属于当前用户；源记录被删除时引用可置空，不删除用户独立完成的新作品。
- `status`：in_progress / submitted / abandoned / retired；state、revision、last_command_id。
- 展示时使用的内容快照、不可变 assessment 和逐项明细。快照不包含尚未公开的答案键。
- `presented_at`、created/updated/submitted 时间，以及分配时冻结的 `first_exposure`。**服务端返回案例前先保存 presented_at**；新旧曝光判定在同一事务中读取先前记录、分配并冻结。网络重试恢复同一记录，不重新获得一次首次曝光。打开过后即使未提交，也不能再把另一个 attempt 宣称为首次见到。

索引与行为：每个用户最多一项进行中的追加练习；按 user/time、user/skill、user/exposureKey 查询。开始操作在数据库内原子选择并占用候选，沿用 `neon-http` 可执行的窄 SQL 命令方式，避免两个标签页拿到不同的“当前练习”。不要在持有数据库锁时调用 Stripe 或模型。

原课程的进行中记录不会被追加练习替换。推荐卡在来源课程 attempt 已提交后才允许开始；若同一 owner lesson 尚有进行中的课程，则提示回到课程完成当前案例。放弃追加练习是明确的操作，保留曝光记录，不计作失败。即使课程访问后来失效，用户仍能放弃自己进行中的追加练习来解除占用，操作不返回受保护内容。

### 6.2 复用评分与恢复，不复用错误的持久化实体

新增：

- `domain/practice/types.ts`：短练习请求、响应、结果、选择原因和错误码。
- `server/practice.ts`、`practice.server.ts`：start / read / update / abandon 的类型化 server functions。
- `features/practice/practice-screen.tsx`：短题目、显式保存、提交、静态反馈与返回入口。
- `routes/practice.index.tsx`、`routes/practice.$attemptId.tsx`：我的练习入口和具体记录。

复用 `LearningScenario`、`transitionAttempt()`、`evaluateStep()`、`assessAttempt()`，以一个 independent stage 表达短练习；为这项复用补齐单阶段测试。只有确实需要共享的题目呈现/草稿控件才从现有 `learning-screen.tsx` 抽出，避免给大组件增加大量模式分支。

首轮追加练习在提交前没有模型调用。若学习者请求课程提示，必须先保存 assistance 标记，再显示提示；失败时不能先展示答案再补记。提交后的静态解析可用，结果仍区分客观检查与待复核文字。

已提交记录不可被重复 submit 或后续评分规则修改重写。断线重试沿用 commandId；不同标签页 revision 冲突要求恢复最新记录。账号切换清除客户端状态并忽略晚到响应。

### 6.3 推荐规则 v1

新增 `domain/practice/recommendation.ts` 和 `server/learning-progress.server.ts`，输出可解释的候选卡片。推荐页读取不算题目曝光，不预取候选正文或答案。

优先级：

1. 恢复尚未完成、仍可访问的追加练习。
2. 当前可访问课程中最近的客观错误所对应技能。
3. 最新成功轮次中仍存在的 AI gap，标为“教练建议”；修订轮优先，不能复活第一轮已经解决的问题。
4. 已到复习时间的技能。
5. 尚未覆盖的下一项合适技能。

每层都过滤课程访问、版本、案例曝光和可用性，并用先修知识决定推荐难度。没有先修证据时，可推荐基础案例或对应课程，但不因此新增课程访问锁。优先新 exposureKey，并增加 case family 多样性；同优先级使用固定顺序，保持刷新稳定。题库耗尽后明确标为复习，不能假称新题或让模型临时发明一道。

模型不能直接指定下一题；客户端点击开始时服务端重新验证候选和来源，再原子分配。读到的旧卡片不是访问凭证。不得把个性化内容放入共享 CDN 缓存。

集成位置：正式独立案例结果下方新增 `next-practice-card.tsx`；`/practice` 顶部显示一项推荐；现有首页/课程页仅给已登录用户提供“继续练习”入口，保持主要课程导航清楚。

## 7. P3：让反馈指向具体证据

第一版只支持三个可靠目标：教学段落、工作表单元格/行、固定收盘合约网格。用引用触发显示，不让模型产生 CSS selector、JavaScript、任意 URL 或可执行工具指令。

建议契约：

```ts
type EvidenceFocusTarget = {
  contextId: string; // 版本、阶段及可见证据的身份
  referenceId: string;
  target:
    | { kind: "paragraph"; paragraphId: string }
    | { kind: "worksheet"; rowIds: string[]; columnIds: string[] }
    | { kind: "contract-grid"; gridId: string; contractIds: string[] };
};
```

改动：

- 新增 `domain/learning/evidence-focus.ts`：有限目标类型、上下文一致性检查。
- `coaching-context.server.ts`：把允许的 referenceId 绑定到服务端拥有的逻辑目标，并保存可回看的结构化展示数据。引用目标仅来自当前已授权、已显示的证据。
- `domain/coaching/types.ts`、`projectCoachingSnapshot()`：增加可选展示字段，兼容 V1 只有文本的记录。旧反馈不得被解释成当前案例的定位命令。
- `domain/learning/types.ts` 中 worksheet 的可选 row/column IDs 与相关 `sourceWorkSchema` 一起更新，旧持久化快照继续可解析；三课内容中为目标赋予语义 ID，不依赖翻译后的标签或当前排序索引。
- `coaching-provider.server.ts`：显式构造模型输入，排除新增 UI 定位/展示元数据，避免把同一证据重复发送。对实际模型输入计算 hash，并记录相应 prompt 版本；不改变两轮生成上限。
- `coaching-feedback.tsx`：增加“在题目中查看”；经 `CoachingPanel → LearningScreen` 的回调触发本地高亮与焦点管理。
- `work-document.tsx` 的 Worksheet、必要的 Facts/段落视图：消费高亮目标，提供可见边框和文字标识。使用本地元素引用或有限 ID 注册，不接受模型选择器。
- `contract-explorer.tsx`、`neighborhood-comparison.tsx`：仅在对应固定收盘网格确实可见时高亮；不重置相机、切片、案例选择或播放时钟。

关键回退：

- `rank-symbols` 指向原始工作表中的当前量/基准列，不把 UniverseExplorer 中人为改变的同组值当作评分证据。
- `rank-contracts` 若用户正在看另一案例、筛选切片或回放中间值，则展开反馈原快照的只读 2D 网格；不暗中替用户切换图表。
- 新旧案例、阶段或证据 fingerprint 不匹配时，显示原快照。仅修改理由但证据未变时仍可定位原证据，不把整个 attempt revision 当成唯一的证据身份。
- 键盘可触发、目标能获得焦点、屏幕阅读器有状态说明；reduced motion 使用即时定位。关闭高亮或恢复失败不影响题目操作。
- 普通证据定位不能改变 attempt answers、inspected、hint、grade。历史引导反馈只能定位其原快照，不定位当前独立题；这仍是复习旧材料。若提供针对当前独立题的新提示，则必须先走第 6 节的 assistance 记录规则，不能伪装为历史引用。

## 8. P4：有出处的能力进度与复习

新增 `domain/practice/skill-progress.ts`，从本人的有效逐项快照推导 `SkillProgressView`，先不建立另一个可任意修改的 learner_profile/mastery 表。

数据来源分开：

- **学习证据**：新版本正式提交的 assessment_details，以及已提交的追加练习结果。
- **辅导观察**：未删除的 coaching 中的建议。只影响推荐，不形成能力通过记录。
- **课程完成**：继续由 lesson_progress 展示，不计入技能证明。

建议显示：

| 状态 | 需要的证据 |
| --- | --- |
| 尚待验证 | 没有足够的客观作答记录；未复核文字不能补成成功 |
| 已练习 | 完成过案例，但使用了帮助或结果尚不支持更强结论 |
| 已在新案例验证 | 至少一个此前未展示的有效案例，在没有站内帮助记录时通过该技能的必要客观项 |
| 多个案例表现稳定 | 最近 30 天内至少三个不同 family 的新案例通过、分布在至少两天，且最近两个有效观测没有失败 |

最近客观失败显示明确的“建议继续练习”提示，并保留此前记录；超过七天的成功记录可触发复习建议，不自动宣称能力退化。阈值是试点规则，版本化并用真实数据校准，不能用“已掌握期权交易”作标签。

“新案例”按服务器记录的曝光判断；语言变化、重试、刷新或版本号变化不自动增加新证据。不能观测站外帮助，因此展示措辞和研究报告要限定为“未记录站内帮助”。案例相似性也需内容评审，不能由哈希证明。

UI：`features/practice/skill-progress.tsx` 显示五张简洁卡片、来源次数、最近日期和下一项练习；点开能查看实际记录。`/practice` 同时提供有限分页的历史，不在首页一次载入所有私人文本。

个人汇总可在登录后保留可见；付费案例正文、题目和证据链接仍重新检查课程访问，过期会员看到锁定提示，不发送受保护内容。撤销访问不能被表述为能力突然消失。

## 9. 数据、访问、删除与分析

数据库增加一张 `practice_attempt` 表及 `lesson_attempt` 的 `assessment_details`、`independent_presented_at` 两个字段，使用下一份可用序号的 additive migration（当前下一份为 0005，实施前重新核对）。不重跑历史 reset migration。

访问分层：当前身份 → 精确 cohort 名单 → 内容 owner lesson 访问 → 记录所有权/版本 → 操作。新增默认关闭的 `LEARNING_PRACTICE_ENABLED`；从现有名单提取独立判定，保留现有配置兼容。关闭 AI 模型不应中断已经开放的静态练习或既有记录读取。

新练习沿用账户学习记录的保留和导出方式；删除账户级联清除。删除单次辅导后不再使用其 gap 推荐，也不保留复制出来的“薄弱项”文本；学习者另行完成的独立练习继续是其作品。历史链接失效时应清楚说明，不能补造来源。若以后新增单条练习删除，需要同时定义曝光和进度重算，不能通过删记录制造“首次作答”。

新路由 `/practice`、`/practice/$attemptId` 都 noindex，不进 sitemap。修改 `seo/pages.ts`、`analyticsRouteName()` 和 `canonicalAnalyticsPath()`，把私有实例路径规范为 `/practice/:attempt`；同步覆盖自定义 page_view、系统 URL/referrer 和 replay 的测试。

新增行为事件：`practice_recommendation_viewed`、`practice_started`、`practice_submitted`、`practice_abandoned`、`evidence_focus_opened`、`skill_progress_viewed`。只允许经过审核的 skill/case-family/版本/来源类别及状态等属性；不发送理由、证据正文、模型输出、用户作品或私有实例 URL。

练习和进度面板统一加 `data-analytics-private`。分析 consent 与核心练习能力分开，拒绝统计不影响学习。供给、作答和评分以数据库为准，浏览器事件不能提升分数或消耗额度。

## 10. 提交拆分与验证

| 提交阶段 | 主要文件/交付 | 必须通过的验证 |
| --- | --- | --- |
| A：质量与事件 | scripts 评估/人工评审、coaching 事件、说明 | 初轮/双轮隔离、费用上界、未评审不算通过、事件不改旧语义 |
| B：证据与切片 | skills、mapping、三条 comparison 案例、assessment_details、practice_attempt migration | 不重算历史、实际 SQL、版本/曝光/owner 校验 |
| C：追加练习 | practice server functions、单阶段 UI、两条路由、推荐卡 | 恢复/冲突/重复请求/放弃、正式课程不被覆盖、paid 边界 |
| D：完整题库 | 30 在线 + 6 离线、推荐策略、来源文案 | 五技能覆盖、family 多样性、近似重复检查、无评估集泄漏 |
| E：视觉证据 | focus 类型、目标绑定、反馈按钮、Worksheet/网格回退 | 当前/历史一致性、隐藏切片、非收盘回放、2D/键盘/减弱动态 |
| F：进度与试点准备 | skill progress、历史、隐私/SEO/分析、验证报告 | 同题不刷进度、AI 不认证、缺数据诚实呈现、可停用与恢复 |

自动化覆盖重点：

- 真实 migrations 的 PGlite 测试，之后在目标预览 Neon 验证原子分配与生产驱动兼容。
- 两标签页同时开始只获得一个当前练习；跨账户、任意 caseId、过期访问、已退休版本和伪造来源均被拒绝。
- 旧 assessment 原样保留；新明细与同次评分一致；未复核文字和 AI 表扬均不能生成成功证据。
- 已展示但放弃的题目、同题换语言、重复提交、相同实质内容的新 ID 不增加“新案例”计数。
- 客观错误优先于 AI 建议，修订后的成功轮不会被初轮旧 gap 覆盖；被删除的辅导退出推荐依据。
- 候选列表、客户端产物和模型输入不包含未来题目/答案或离线评估集。
- 当引用无法定位时退回原快照；视觉聚焦前后 grade、answers、选择、相机和回放状态不变。
- 新路由的账号切换、草稿保存失败、历史访问、私有 URL 归一化、consent 与 replay 阻挡。

浏览器必须完成一次真实流程：三课中的引导反馈 → 原课程独立案例 → 推荐 → 新短练习 → 结果 → 进度 → 刷新恢复/换账号；另检查中文 390px、暗色、键盘、reduced motion 和不可定位证据回退。固定反馈预览与真实 provider 结果必须分开标注。

实现时运行 Node 24 下的相关 tests、`pnpm check-types`、Web/DB 测试、production build、媒体/秘密检查和定向 Biome。全库既有生成资源诊断单独记录，不覆盖别人的改动来清理它们。每个验证完的完整阶段本地提交，不自动 push。

## 11. 试点评估与停止规则

先招募约 20–30 名目标学习者，观察四周。这是方向验证，不足以宣称普遍教学效果。

- 反馈质量：严重事实错误、错误肯定、隐藏案例泄漏或错误能力认证出现时，暂停相关 AI 功能并修正。
- 行为：成功初轮用户中完成修订的比例、推荐到开始再到完成的比例、七日内再次完成新练习的比例。各分母和失败原因分别记录。
- 学习：使用未曝光案例，区分站内帮助、重复题和旧版本；比较当前流程与加入针对性练习后的表现，文字推理由盲评检查。测试集不用于调整推荐后再当作独立证明。
- 付费：在回访和学习信号出现后，再验证继续使用的实际支付选择；不把 AI 点击率视为付费意愿。

原计划的修订完成率 ≥50%、七日回访 ≥1/3 可作为试点目标，明确它们不是行业基准。若互动多但新案例表现没有改善，先修改反馈或案例，而不是增加角色、更多消息额度或自动生成内容。

## 12. 后续：研究答辩模拟

仅在上面的质量和重复使用证据成立后推进。目标是一个有起止的活动：用户提交研究结论，AI 以质疑者角色围绕证据、假设和失效条件追问，结束后给出修订记录。

先提供文字形式，约 3–5 分钟，避免因语音识别或表达风格替代推理质量。若进入实施，应另行定义多轮预算、会话恢复、角色约束和评估方案；不能复用两轮 coaching 会话字段硬塞一个无限聊天流程，也不能把角色模拟成绩并入当前 mastery。

本计划优先交付的是可解释的下一项练习和可信的进步证据；它们成立后，答辩、语音和更多个性化形式才有可检验的价值基础。
