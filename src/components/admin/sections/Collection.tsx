"use client";

import { entityDefs } from "@/lib/admin/defs";
import { RecordTable } from "@/components/admin/RecordTable";
import { SectionHead } from "@/components/admin/Ui";
import { ADMIN_MENU } from "@/lib/admin/menu";

/** Generic collection screen: one definition drives list, form and validation. */
export function CollectionSection({ id }: { id: string }) {
  const def = entityDefs[id];
  const menu = ADMIN_MENU.find((item) => item.id === id);
  if (!def || !menu) return null;

  return (
    <div className="space-y-6">
      <SectionHead no={menu.no} eyebrow={def.eyebrow} title={def.title.ko} description={def.description.ko} />
      <div className="border border-line bg-paper p-5">
        <RecordTable def={def} />
      </div>
    </div>
  );
}
