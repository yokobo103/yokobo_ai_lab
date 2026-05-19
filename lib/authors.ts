export const authorProfiles = [
  {
    id: "chief",
    name: "所長",
    title: "AIラボ所長",
    description: "よこぼのAIラボをゆるく見守る、たのしい実験の案内役。",
    image: "/assets/characters/chief-profile.webp",
    aliases: ["所長", "園長", "所長よこぼ"]
  },
  {
    id: "dr-yokobo",
    name: "Dr.よこぼ",
    title: "実験担当研究者",
    description: "AIラボで日々あやしい実験をしている研究者。",
    image: "/assets/characters/dr-yokobo-profile-card.webp",
    aliases: ["Dr.よこぼ", "Drよこぼ", "ドクターよこぼ"]
  },
  {
    id: "nyabitto",
    name: "ニャビット",
    title: "ラボの相棒ロボ",
    description: "実験を横で見守りながら、たまに鋭いひらめきをくれるラボの相棒。",
    image: "/assets/characters/nyabitto-profile-card.webp",
    aliases: ["ニャビット", "Nyabbit", "nyabbit"]
  }
] as const;

export type AuthorId = (typeof authorProfiles)[number]["id"];
export type AuthorProfile = (typeof authorProfiles)[number];

export const defaultAuthorId: AuthorId = "dr-yokobo";

export function normalizeAuthorId(value: unknown): AuthorId | null {
  return authorProfiles.some((profile) => profile.id === value) ? (value as AuthorId) : null;
}

export function getAuthorProfile(authorId: unknown): AuthorProfile {
  return authorProfiles.find((profile) => profile.id === authorId) ?? authorProfiles.find((profile) => profile.id === defaultAuthorId)!;
}

export function inferAuthorIdFromText(value: string): AuthorId {
  const lead = value.slice(0, 320);
  const authorLine = lead.match(/担当[：:]\s*([^\n\r]+)/)?.[1] ?? lead;

  return (
    authorProfiles.find((profile) =>
      profile.aliases.some((alias) => authorLine.includes(alias))
    )?.id ?? defaultAuthorId
  );
}
