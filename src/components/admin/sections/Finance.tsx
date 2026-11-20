"use client";

import { defFor } from "@/lib/admin/defs";
import { financeTotals, formatKrw, groupFinanceByMonth, monthOf } from "@/lib/admin/metrics";
import { useAdminData } from "@/lib/admin/store";
import { RecordTable } from "@/components/admin/RecordTable";
import { Panel, SectionHead, Stat, Tag } from "@/components/admin/Ui";

const INFRA_PATTERN = /(인프라|서버|도메인|호스팅|supabase|cloudflare|스토리지|database|domain|hosting)/i;

export function FinanceSection() {
  const { data } = useAdminData();
  const def = defFor("finance");
  const currentMonth = monthOf(new Date().toISOString());
  const thisMonth = financeTotals(data.finance, currentMonth);
  const all = financeTotals(data.finance);
  const months = groupFinanceByMonth(data.finance);
  const infraCost = data.finance
    .filter((record) => record.direction === "expense" && record.currency === "KRW" && INFRA_PATTERN.test(`${record.category} ${record.item}`))
    .filter((record) => monthOf(record.date) === currentMonth)
    .reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="space-y-6">
      <SectionHead
        no="14"
        eyebrow="MENU 14 · FINANCE"
        title="매출 및 비용 기록"
        description="수입과 지출을 입금·출금 단위로 기록합니다. 인프라 고정비 목표는 매달 ₩0이고, 넘으면 이 화면에서 바로 보입니다."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-line bg-paper p-4">
          <Stat label={`수입 · ${currentMonth}`} value={formatKrw(thisMonth.income)} note={`건수 ${data.finance.filter((r) => monthOf(r.date) === currentMonth && r.direction === "income").length}`} />
        </div>
        <div className="border border-line bg-paper p-4">
          <Stat label={`지출 · ${currentMonth}`} value={formatKrw(thisMonth.expense)} note={`건수 ${data.finance.filter((r) => monthOf(r.date) === currentMonth && r.direction === "expense").length}`} />
        </div>
        <div className="border border-line bg-paper p-4">
          <Stat label="순액 · 이번 달" value={formatKrw(thisMonth.net)} note="수입 − 지출" />
        </div>
        <div className="border border-line bg-paper p-4">
          <Stat label="누적 손익" value={formatKrw(all.net)} note={`전체 ${data.finance.length}건`} />
        </div>
      </div>

      <Panel
        title="0원 한도 체크"
        note="인프라·서버·도메인 항목의 이번 달 지출"
        action={<Tag tone={infraCost > 0 ? "warn" : "brass"}>{infraCost > 0 ? "확인 필요" : "₩0 유지"}</Tag>}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="font-serif text-[2rem] leading-none text-ink">{formatKrw(infraCost)}</p>
          <p className="max-w-[46ch] font-sans text-[0.6875rem] leading-relaxed text-muted">
            {infraCost > 0
              ? "무료 한도를 넘는 지출이 기록되었습니다. 자동 결제가 아니라 대안 또는 보고가 원칙입니다 — 어떤 항목인지 아래 표에서 확인하세요."
              : "Cloudflare Pages Free + Supabase Free 조합은 이번 달 0원입니다. 결제가 발생하면 이 숫자가 먼저 움직입니다."}
          </p>
        </div>
      </Panel>

      <div className="border border-line bg-paper p-5">
        <RecordTable def={def} />
      </div>

      <Panel title="월별 합계" note="KRW 기준 · USD 건은 통화가 달라 합계에서 분리합니다">
        {months.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-muted">기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-y border-ink/80">
                  {["월", "수입", "지출", "순액", "건수"].map((label) => (
                    <th key={label} className="px-2 py-2 font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((row) => (
                  <tr key={row.month} className="border-b border-line font-sans text-[0.75rem]">
                    <td className="px-2 py-2 tabular-nums text-ink">{row.month}</td>
                    <td className="px-2 py-2 tabular-nums text-graphite">{formatKrw(row.totals.income)}</td>
                    <td className="px-2 py-2 tabular-nums text-graphite">{formatKrw(row.totals.expense)}</td>
                    <td className="px-2 py-2 tabular-nums text-ink">{formatKrw(row.totals.net)}</td>
                    <td className="px-2 py-2 tabular-nums text-muted">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {all.foreign > 0 ? (
          <p className="mt-3 font-sans text-[0.625rem] text-muted">USD 기록 합계: ${all.foreign.toLocaleString("en-US")} (환율 적용 전)</p>
        ) : null}
      </Panel>
    </div>
  );
}
