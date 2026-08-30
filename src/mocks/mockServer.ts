import {
  User,
  Transaction,
  Budget,
  Goal,
  AiInsight,
  Subscription,
  HealthScore,
  AppNotification,
  AuthTokens,
  AnalyticsSummary,
  CategoryAnalytics,
  TrendPoint,
  ConversationSummary,
  ChatMessage,
} from '@/types';
import {
  demoUser,
  allTransactions,
  budgetConfig,
  goalsFixture,
  subscriptionsFixture,
  insightsFixture,
  healthScoreHistory,
  notificationsFixture,
} from './fixtures';
import { getCategory } from '@/constants/categories';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** In-memory, session-mutable mock backend. Mirrors Nuvo-Backend's contracts exactly. */
class MockServer {
  user: User = clone(demoUser);
  transactions: Transaction[] = clone(allTransactions);
  budget = clone(budgetConfig);
  goals: Goal[] = clone(goalsFixture);
  subscriptions: Subscription[] = clone(subscriptionsFixture);
  insights: AiInsight[] = clone(insightsFixture);
  healthScoreHistory: HealthScore[] = clone(healthScoreHistory);
  notifications: AppNotification[] = clone(notificationsFixture);
  conversations: ConversationSummary[] = [];
  lunaMessageStore: ChatMessage[] = [];
  private txnSeq = 9000;
  private lunaSeq = 1;

  private nextTxnId() {
    return `txn_${this.txnSeq++}`;
  }

  private confirmedInWindow(days: number, type: Transaction['type']) {
    const cutoff = Date.now() - days * 86_400_000;
    return this.transactions.filter(
      (t) => t.status === 'confirmed' && t.type === type && new Date(t.transactionAt).getTime() >= cutoff,
    );
  }

  // ---------- Auth ----------
  async login(email: string, _password: string): Promise<{ user: User; tokens: AuthTokens }> {
    this.user.email = email || this.user.email;
    return { user: clone(this.user), tokens: this.issueTokens() };
  }

  async register(body: { name: string; email: string; phone?: string; currency?: string }): Promise<{ user: User; tokens: AuthTokens }> {
    this.user = { ...this.user, name: body.name, email: body.email, phone: body.phone ?? this.user.phone, currency: body.currency ?? 'INR' };
    return { user: clone(this.user), tokens: this.issueTokens() };
  }

  async loginWithGoogle(): Promise<{ user: User; tokens: AuthTokens }> {
    this.user.oauthProvider = 'google';
    return { user: clone(this.user), tokens: this.issueTokens() };
  }

  issueTokens(): AuthTokens {
    const stamp = Math.random().toString(36).slice(2);
    return { accessToken: `mock_access_${stamp}`, refreshToken: `mock_refresh_${stamp}` };
  }

  async refresh(): Promise<AuthTokens> {
    return this.issueTokens();
  }

  async changePassword() {
    return null;
  }

  /** No real OTP to check in mock mode — any 4-digit code is accepted. */
  async resetPassword(_body: { email: string; otp: string; newPassword: string }) {
    return null;
  }

  async getMe(): Promise<User> {
    return clone(this.user);
  }

  async updateProfile(patch: Partial<User>) {
    this.user = { ...this.user, ...patch, aiProfile: { ...this.user.aiProfile, ...(patch.aiProfile ?? {}) } };
    return clone(this.user);
  }

  async uploadAvatar(uri: string) {
    // No real storage backend in mock mode — just point the user doc at the local picked file.
    this.user = { ...this.user, avatarUrl: uri };
    return clone(this.user);
  }

  // ---------- Transactions ----------
  async listTransactions(query: {
    page?: number;
    limit?: number;
    category?: string;
    type?: Transaction['type'];
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    let items = this.transactions.filter((t) => t.status !== 'rejected');

    if (query.category) items = items.filter((t) => t.category === query.category);
    if (query.type) items = items.filter((t) => t.type === query.type);
    if (query.startDate) items = items.filter((t) => new Date(t.transactionAt) >= new Date(query.startDate!));
    if (query.endDate) items = items.filter((t) => new Date(t.transactionAt) <= new Date(query.endDate!));
    if (query.search) {
      const q = query.search.toLowerCase();
      items = items.filter(
        (t) => t.merchant?.toLowerCase().includes(q) || getCategory(t.category).label.toLowerCase().includes(q),
      );
    }

    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    return {
      items: clone(paged),
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
    };
  }

  async getTransaction(id: string) {
    const txn = this.transactions.find((t) => t._id === id);
    if (!txn) throw new Error('Transaction not found');
    return clone(txn);
  }

  async createTransaction(body: Partial<Transaction>): Promise<{ transaction: Transaction }> {
    const now = new Date().toISOString();
    const txn: Transaction = {
      _id: this.nextTxnId(),
      userId: this.user._id,
      type: body.type ?? 'expense',
      amount: body.amount ?? 0,
      currency: body.currency ?? 'INR',
      category: body.category ?? 'other',
      merchant: body.merchant,
      paymentMethod: body.paymentMethod ?? 'UPI',
      aiCategorized: false,
      isAnomalous: false,
      status: 'confirmed',
      tags: body.tags ?? [],
      notes: body.notes,
      description: body.description,
      transactionAt: body.transactionAt ?? now,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.unshift(txn);
    return { transaction: clone(txn) };
  }

  async updateTransaction(id: string, patch: Partial<Transaction>): Promise<{ transaction: Transaction }> {
    const idx = this.transactions.findIndex((t) => t._id === id);
    if (idx === -1) throw new Error('Transaction not found');
    this.transactions[idx] = { ...this.transactions[idx], ...patch, updatedAt: new Date().toISOString() };
    return { transaction: clone(this.transactions[idx]) };
  }

  async deleteTransaction(id: string) {
    this.transactions = this.transactions.filter((t) => t._id !== id);
    return null;
  }

  /** Simulates the OCR pipeline (spec §7.1/§8): creates a pending, pre-filled transaction and a matching job. */
  async scanReceipt(): Promise<{ transactionId: string; jobId: string }> {
    const merchants = [
      { merchant: 'Cafe Coffee Day', category: 'food_dining', amount: 340, items: [{ name: 'Cappuccino', qty: 2, unitPrice: 140, totalPrice: 280 }, { name: 'Brownie', qty: 1, unitPrice: 60, totalPrice: 60 }] },
      { merchant: 'Reliance Fresh', category: 'food_dining', amount: 1120, items: [{ name: 'Groceries (12 items)', qty: 1, unitPrice: 1120, totalPrice: 1120 }] },
      { merchant: 'Apollo Pharmacy', category: 'health_wellness', amount: 560, items: [{ name: 'Prescription medicines', qty: 1, unitPrice: 560, totalPrice: 560 }] },
    ];
    const pick = merchants[Math.floor(Math.random() * merchants.length)];
    const now = new Date().toISOString();
    const txn: Transaction = {
      _id: this.nextTxnId(),
      userId: this.user._id,
      type: 'expense',
      amount: pick.amount,
      currency: 'INR',
      category: pick.category,
      merchant: pick.merchant,
      paymentMethod: 'cash',
      receiptUrl: 'https://images.nuvo.app/mock/receipts/scan.jpg',
      ocrData: { confidence: 0.91, items: pick.items, taxAmount: Math.round(pick.amount * 0.05) },
      aiCategorized: true,
      isAnomalous: false,
      status: 'pending',
      tags: [],
      transactionAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.unshift(txn);
    return { transactionId: txn._id, jobId: `mock-job-${txn._id}` };
  }

  async parseUpiScreenshot(): Promise<{ transactionId: string; jobId: string }> {
    const apps = [
      { merchant: 'Swiggy', app: 'Google Pay', amount: 428, category: 'food_dining' },
      { merchant: 'Rahul Sharma', app: 'PhonePe', amount: 1500, category: 'transfer' },
      { merchant: 'BookMyShow', app: 'Paytm', amount: 700, category: 'entertainment' },
    ];
    const pick = apps[Math.floor(Math.random() * apps.length)];
    const now = new Date().toISOString();
    const txn: Transaction = {
      _id: this.nextTxnId(),
      userId: this.user._id,
      type: 'expense',
      amount: pick.amount,
      currency: 'INR',
      category: pick.category,
      merchant: pick.merchant,
      paymentMethod: 'UPI',
      upiRefId: `UPI${Math.floor(Math.random() * 9e11)}`,
      aiCategorized: true,
      isAnomalous: false,
      status: 'pending',
      tags: [pick.app],
      transactionAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.unshift(txn);
    return { transactionId: txn._id, jobId: `mock-job-${txn._id}` };
  }

  /** Both scan and UPI-parse jobs resolve instantly in mock mode — one poll tick is enough. */
  async getScanJobStatus(_jobId: string): Promise<{ state: string; result?: unknown }> {
    return { state: 'completed' };
  }

  async createVoiceTransaction(_uri: string): Promise<{ transaction: Transaction }> {
    // Mock mode has no server-side speech-to-text — the real backend transcribes the actual
    // recording via Gemini; here we just simulate a plausible transcript for the demo fixture.
    const transcript = 'Spent 250 on food';
    const amountMatch = transcript.match(/(\d+(?:[.,]\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : 250;
    const lower = transcript.toLowerCase();
    let category = 'other';
    let merchant: string | undefined;
    for (const c of ['food', 'auto', 'cab', 'uber', 'ola', 'movie', 'medicine', 'grocery']) {
      if (lower.includes(c)) {
        category =
          c === 'auto' || c === 'cab' || c === 'uber' || c === 'ola'
            ? 'transportation'
            : c === 'movie'
              ? 'entertainment'
              : c === 'medicine'
                ? 'health_wellness'
                : 'food_dining';
        merchant = c.charAt(0).toUpperCase() + c.slice(1);
      }
    }
    const isIncome = lower.includes('salary') || lower.includes('received');
    const now = new Date().toISOString();
    const txn: Transaction = {
      _id: this.nextTxnId(),
      userId: this.user._id,
      type: isIncome ? 'income' : 'expense',
      amount,
      currency: 'INR',
      category: isIncome ? 'income' : category,
      merchant,
      paymentMethod: 'UPI',
      aiCategorized: true,
      isAnomalous: false,
      status: 'confirmed',
      tags: ['voice'],
      description: transcript,
      transactionAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.unshift(txn);
    return { transaction: clone(txn) };
  }

  // ---------- Budgets ----------
  async getCurrentBudget(): Promise<Budget> {
    const expenses = this.confirmedInWindow(30, 'expense');
    const income = this.confirmedInWindow(30, 'income');
    const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = income.reduce((s, t) => s + t.amount, 0);

    const byCategory = new Map<string, number>();
    for (const t of expenses) byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);

    const categoryBreakdown = Object.entries(this.budget.categoryBudgets).map(([category, budgetAmt]) => ({
      category,
      budget: budgetAmt,
      spent: byCategory.get(category) ?? 0,
    }));

    return {
      ...this.budget,
      totalSpent,
      totalIncome,
      categoryBreakdown,
    };
  }

  async updateBudgetSettings(patch: { monthlyBudget?: number; categoryBreakdown?: { category: string; budget: number }[] }) {
    if (patch.monthlyBudget !== undefined) this.budget.totalBudget = patch.monthlyBudget;
    if (patch.categoryBreakdown) {
      for (const c of patch.categoryBreakdown) this.budget.categoryBudgets[c.category] = c.budget;
    }
    return this.getCurrentBudget();
  }

  async updateStopLoss(patch: Partial<Budget['stopLoss']>) {
    this.budget.stopLoss = { ...this.budget.stopLoss, ...patch };
    return this.getCurrentBudget();
  }

  // ---------- Analytics ----------
  async analyticsSummary(): Promise<AnalyticsSummary> {
    const budget = await this.getCurrentBudget();
    const priorExpenses = this.transactions.filter((t) => {
      const days = (Date.now() - new Date(t.transactionAt).getTime()) / 86_400_000;
      return t.status === 'confirmed' && t.type === 'expense' && days >= 30 && days < 60;
    });
    const priorTotal = priorExpenses.reduce((s, t) => s + t.amount, 0);
    return {
      income: budget.totalIncome,
      expense: budget.totalSpent,
      savings: budget.totalIncome - budget.totalSpent,
      incomeDelta: 0,
      expenseDelta: priorTotal ? Math.round(((budget.totalSpent - priorTotal) / priorTotal) * 100) : 0,
      savingsDelta: 0,
      periodLabel: 'This month',
    };
  }

  async analyticsCategories(): Promise<CategoryAnalytics[]> {
    const budget = await this.getCurrentBudget();
    const total = budget.totalSpent || 1;
    return budget.categoryBreakdown
      .filter((c) => c.spent > 0)
      .map((c) => ({
        category: c.category,
        amount: c.spent,
        count: this.confirmedInWindow(30, 'expense').filter((t) => t.category === c.category).length,
        pctOfTotal: Math.round((c.spent / total) * 1000) / 10,
        budgeted: c.budget,
        priorPeriodDelta: Math.round((Math.random() - 0.4) * 30),
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  async analyticsTrends(days = 30): Promise<TrendPoint[]> {
    const points: TrendPoint[] = [];
    let cumulative = 0;
    let priorCumulative = 0;
    for (let d = days - 1; d >= 0; d--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - d);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const priorDayStart = new Date(dayStart);
      priorDayStart.setDate(priorDayStart.getDate() - days);
      const priorDayEnd = new Date(priorDayStart);
      priorDayEnd.setDate(priorDayEnd.getDate() + 1);

      const dayTotal = this.transactions
        .filter((t) => t.status === 'confirmed' && t.type === 'expense')
        .filter((t) => {
          const at = new Date(t.transactionAt).getTime();
          return at >= dayStart.getTime() && at < dayEnd.getTime();
        })
        .reduce((s, t) => s + t.amount, 0);

      const priorDayTotal = this.transactions
        .filter((t) => t.status === 'confirmed' && t.type === 'expense')
        .filter((t) => {
          const at = new Date(t.transactionAt).getTime();
          return at >= priorDayStart.getTime() && at < priorDayEnd.getTime();
        })
        .reduce((s, t) => s + t.amount, 0);

      cumulative += dayTotal;
      priorCumulative += priorDayTotal;
      points.push({ date: dayStart.toISOString(), amount: cumulative, priorPeriodAmount: priorCumulative });
    }
    return points;
  }

  async analyticsHealthScore() {
    return { current: clone(this.healthScoreHistory[this.healthScoreHistory.length - 1]), history: clone(this.healthScoreHistory) };
  }

  async analyticsMonthlyHistory(months = 6) {
    const now = new Date();
    const labelFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' });
    const points: { year: number; month: number; label: string; income: number; expense: number; savings: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const { income, expense } = this.transactions.reduce(
        (acc, t) => {
          if (t.status !== 'confirmed') return acc;
          const ta = new Date(t.transactionAt);
          if (ta.getUTCFullYear() !== year || ta.getUTCMonth() !== month) return acc;
          if (t.type === 'income') acc.income += t.amount;
          else if (t.type === 'expense') acc.expense += t.amount;
          return acc;
        },
        { income: 0, expense: 0 },
      );
      points.push({ year, month: month + 1, label: labelFmt.format(d), income, expense, savings: income - expense });
    }
    return points;
  }

  // ---------- LUNA / AI ----------
  private nextLunaId(prefix: string) {
    return `${prefix}_${this.lunaSeq++}`;
  }

  private generateLunaReply(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('food') || lower.includes('swiggy') || lower.includes('zomato')) {
      return 'You’ve spent ₹8,240 on Food & Dining this month across 14 orders — about 22% of your total spend. Cutting delivery to twice a week would save roughly ₹1,840/month.';
    }
    if (lower.includes('save') || lower.includes('saving')) {
      return 'Your savings rate this month is ~24%. Redirecting ₹2,000 from dining and ₹1,500 from entertainment would add ₹3,500/month toward your Japan Trip goal — finishing it a month early.';
    }
    if (lower.includes('budget') || lower.includes('spend')) {
      return 'You’ve used ₹37,928 of your ₹45,000 budget (84%). At this pace you’ll land around ₹46,200 by month end — ₹1,200 over. Try a ₹950/day cap for the rest of the period.';
    }
    if (lower.includes('goal') || lower.includes('japan')) {
      return 'Japan Trip 2027 needs ₹14,286/month — you’re contributing ₹15,800, so you’re slightly ahead and on pace to finish a month early.';
    }
    if (lower.includes('subscription')) {
      return 'You have 6 active subscriptions totalling ₹5,164/month (₹61,968/year). Cult.fit looks underused this month — want a cancellation guide?';
    }
    if (lower.includes('anomaly') || lower.includes('indigo') || lower.includes('unusual')) {
      return 'The ₹4,899 IndiGo charge is 3.4x your usual transport spend — it lines up with a flight booking rather than daily travel, so it’s most likely expected.';
    }
    return "I'm keeping an eye on your spending — you're at 84% of this month's budget. Want a category breakdown or a savings idea?";
  }

  private deriveLunaTitle(message: string): string {
    const trimmed = message.trim().replace(/\s+/g, ' ');
    return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed || 'New chat';
  }

  private getOrCreateConversation(conversationId?: string): ConversationSummary {
    if (conversationId) {
      const existing = this.conversations.find((c) => c._id === conversationId);
      if (existing) return existing;
    }
    const conversation: ConversationSummary = {
      _id: this.nextLunaId('conv'),
      title: 'New chat',
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
    };
    this.conversations.unshift(conversation);
    return conversation;
  }

  private appendLunaTurn(conversation: ConversationSummary, userBody: string, inputMode: 'text' | 'voice') {
    const isNew = conversation.messageCount === 0;
    const now = new Date().toISOString();

    const userMsg: ChatMessage = {
      _id: this.nextLunaId('msg'),
      conversationId: conversation._id,
      role: 'user',
      body: userBody,
      inputMode,
      createdAt: now,
    };
    this.lunaMessageStore.push(userMsg);

    const reply = this.generateLunaReply(userBody);
    const assistantMsg: ChatMessage = {
      _id: this.nextLunaId('msg'),
      conversationId: conversation._id,
      role: 'assistant',
      body: reply,
      inputMode,
      createdAt: new Date().toISOString(),
    };
    this.lunaMessageStore.push(assistantMsg);

    conversation.messageCount += 2;
    conversation.lastMessageAt = assistantMsg.createdAt;
    if (isNew) conversation.title = this.deriveLunaTitle(userBody);

    return { userMsg, assistantMsg, reply };
  }

  async lunaConversations(): Promise<ConversationSummary[]> {
    return clone(
      [...this.conversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
    );
  }

  async lunaMessages(conversationId: string): Promise<ChatMessage[]> {
    // No re-sort by createdAt: two messages in the same turn can share a millisecond
    // timestamp, which makes a createdAt-based sort comparator unstable for ties. The
    // store is only ever appended to via push(), so array order already is creation order.
    return clone(this.lunaMessageStore.filter((m) => m.conversationId === conversationId));
  }

  async lunaChat(body: { conversationId?: string; message: string }) {
    const conversation = this.getOrCreateConversation(body.conversationId);
    const { userMsg, assistantMsg, reply } = this.appendLunaTurn(conversation, body.message, 'text');
    return { conversationId: conversation._id, userMessageId: userMsg._id, assistantMessageId: assistantMsg._id, reply };
  }

  async lunaVoice(body: { conversationId?: string; uri: string }) {
    const conversation = this.getOrCreateConversation(body.conversationId);
    const transcript = 'This is a mock transcription of your voice message.';
    const { userMsg, assistantMsg, reply } = this.appendLunaTurn(conversation, transcript, 'voice');
    return {
      conversationId: conversation._id,
      userMessageId: userMsg._id,
      assistantMessageId: assistantMsg._id,
      transcript,
      reply,
    };
  }

  async lunaRegenerate(conversationId: string) {
    const conversation = this.conversations.find((c) => c._id === conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const lastUser = [...this.lunaMessageStore].reverse().find((m) => m.conversationId === conversationId && m.role === 'user');
    if (!lastUser) throw new Error('No message to regenerate a reply for');

    const reply = this.generateLunaReply(lastUser.body);
    const assistantMsg: ChatMessage = {
      _id: this.nextLunaId('msg'),
      conversationId,
      role: 'assistant',
      body: reply,
      inputMode: lastUser.inputMode,
      createdAt: new Date().toISOString(),
    };
    this.lunaMessageStore.push(assistantMsg);
    conversation.messageCount += 1;
    conversation.lastMessageAt = assistantMsg.createdAt;

    return { assistantMessageId: assistantMsg._id, reply };
  }

  async lunaEditMessage(body: { conversationId: string; messageId: string; body: string }) {
    const conversation = this.conversations.find((c) => c._id === body.conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const targetIndex = this.lunaMessageStore.findIndex(
      (m) => m._id === body.messageId && m.conversationId === body.conversationId,
    );
    if (targetIndex === -1) throw new Error('Message not found');
    const target = this.lunaMessageStore[targetIndex];

    target.body = body.body;
    const before = this.lunaMessageStore.length;
    // Index, not createdAt: two messages in the same turn can share a millisecond timestamp
    // (created back-to-back with no delay), but push order is always true creation order.
    this.lunaMessageStore = this.lunaMessageStore.filter(
      (m, i) => m.conversationId !== body.conversationId || i <= targetIndex,
    );
    const removed = before - this.lunaMessageStore.length;

    const reply = this.generateLunaReply(target.body);
    const assistantMsg: ChatMessage = {
      _id: this.nextLunaId('msg'),
      conversationId: body.conversationId,
      role: 'assistant',
      body: reply,
      inputMode: target.inputMode,
      createdAt: new Date().toISOString(),
    };
    this.lunaMessageStore.push(assistantMsg);
    conversation.messageCount = Math.max(0, conversation.messageCount - removed) + 1;
    conversation.lastMessageAt = assistantMsg.createdAt;

    return { assistantMessageId: assistantMsg._id, reply };
  }

  async lunaDeleteConversation(id: string): Promise<null> {
    this.conversations = this.conversations.filter((c) => c._id !== id);
    this.lunaMessageStore = this.lunaMessageStore.filter((m) => m.conversationId !== id);
    return null;
  }

  async lunaInsights() {
    return clone(this.insights);
  }

  async lunaOpportunities() {
    return clone(this.insights.filter((i) => i.type === 'savings_opportunity' || i.type === 'subscription_audit'));
  }

  async createGoal(body: Partial<Goal>): Promise<Goal> {
    const monthsToTarget = Math.max(
      1,
      Math.round((new Date(body.targetDate!).getTime() - Date.now()) / (30 * 86_400_000)),
    );
    const goal: Goal = {
      _id: `goal_${Date.now()}`,
      userId: this.user._id,
      name: body.name ?? 'New Goal',
      targetAmount: body.targetAmount ?? 10000,
      savedAmount: 0,
      targetDate: body.targetDate ?? new Date().toISOString(),
      category: body.category,
      aiPlan: {
        requiredMonthlySavings: Math.round((body.targetAmount ?? 10000) / monthsToTarget),
        recommendations: ['LUNA will refine this plan as your spending pattern becomes clearer.'],
      },
      status: 'on_track',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.goals.unshift(goal);
    return clone(goal);
  }

  async listGoals() {
    return clone(this.goals);
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const goal = this.goals.find((g) => g._id === id);
    if (!goal) throw new Error('Goal not found');
    Object.assign(goal, updates);
    return clone(goal);
  }

  async contributeToGoal(id: string, amount: number): Promise<Goal> {
    const goal = this.goals.find((g) => g._id === id);
    if (!goal) throw new Error('Goal not found');
    goal.savedAmount += amount;
    if (goal.savedAmount >= goal.targetAmount) goal.status = 'completed';
    return clone(goal);
  }

  async subscriptionAudit() {
    const monthlyTotal = this.subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + (s.frequency === 'yearly' ? s.amount / 12 : s.frequency === 'quarterly' ? s.amount / 3 : s.amount), 0);
    return { subscriptions: clone(this.subscriptions), monthlyTotal: Math.round(monthlyTotal), annualTotal: Math.round(monthlyTotal * 12) };
  }

  // ---------- Notifications ----------
  async listNotifications() {
    return clone(this.notifications);
  }

  async markNotificationRead(id: string) {
    const n = this.notifications.find((x) => x._id === id);
    if (n) n.isRead = true;
    return null;
  }

  async markAllNotificationsRead() {
    this.notifications.forEach((n) => (n.isRead = true));
    return null;
  }
}

export const mockServer = new MockServer();

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
