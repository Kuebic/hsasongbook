import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { nanoid } from "nanoid";
import { slugify } from "./permissions";

/**
 * CARP Song Book seed data
 * Source: https://www.tparents.org/Library/Unification/Topics/CarpSong/0-Toc.htm
 *
 * These are traditional holy songs from the Unification movement songbook.
 * Run with: npx convex run seedCarpSongs:seedCarpSongs
 */

const CARP_SONGS = [
  {
    title: "Blessing of Glory",
    songNumber: 1,
    themes: ["glory", "grace", "awakening"],
    origin: "carp-songbook",
    key: "C",
    chordProContent: `{title: Blessing of Glory}
{key: C}

{start_of_verse: Verse 1}
[C]Now the light of [Am]glory arises like the [F]sun that [C]shines on [G7]high;
[Am]Now awaken [Em]into [G]freedom, [C]O revive, you [F]spirits, O re[C]vive!
[Am]Wake the mountains and the [F]valleys; bring a[Dm7]live the springs [G7]of the [C]earth.
Light the [C]world for[Am]ever with the [Em]Light of [Am]your re[Em]birth.
[F]Light the [C]world for[Am]ever [C/G]with the [G7]Light of your re[C]birth.
{end_of_verse}

{start_of_verse: Verse 2}
We are called to bring back the glory to the life of God above;
Now the Lord in His greatness fills the universe with tender love,
Ever seeking souls awakened, ever calling them to be free.
How shall I attend Him who is calling to me?
How shall I attend Him who is calling to me?
{end_of_verse}

{start_of_verse: Verse 3}
From the dark of death I awaken and rejoice to live in grace;
When the one who came to save me holds me tenderly in His embrace;
I rejoice to feel the comfort of the love He has for me;
What a blessing of glory to rejoice eternally!
What a blessing of glory to rejoice eternally!
{end_of_verse}

{start_of_verse: Verse 4}
Now He lifts me up to embrace me in the blessing that is mine;
What a blessing to receive Him in a love so tender and divine;
How can I return the blessing though in all my life I will try;
I can never stop feeling how unworthy am I
I can never stop feeling how unworthy am I
{end_of_verse}`,
  },
  {
    title: "Grace of the Holy Garden",
    songNumber: 2,
    themes: ["grace", "blessing", "gratitude"],
    origin: "carp-songbook",
    key: "G",
    chordProContent: `{title: Grace of the Holy Garden}
{key: G}

{start_of_verse: Verse 1}
[G]Grace filling [Bm]me with [G]golden [C]light, measureless blessing divine;
[G]God gives e[Bm]ternal [G]life to [C]me, [D7]perfect rejoicing is [G]mine.
{end_of_verse}

{start_of_chorus: Chorus}
[C]Glorious the [G]song [C]ringing [G]in my heart for my [D7]Father above;
[G]Gratefully I [C]give offering to [G]Him, [C]triumph and [G6]glorious [D7]love.[G]
{end_of_chorus}

{start_of_verse: Verse 2}
Joy surging like an ocean wave, flowing so deep in my soul;
Hope rises as I go in praise, knowing that man will be whole.
{end_of_verse}

{start_of_verse: Verse 3}
High, limitless eternal life, touching the top of the sky;
Praise filling every part of me, blessing that never will die.
{end_of_verse}

{start_of_verse: Verse 4}
You've chosen me to do Your will, thankful, I vow to be true;
I'm pledging in my heart of hearts; Father, my life is for You.
{end_of_verse}`,
  },
  {
    title: "New Song of Inspiration",
    songNumber: 3,
    themes: ["inspiration", "sacrifice", "dedication"],
    origin: "carp-songbook",
    key: "Bb",
    chordProContent: `{title: New Song of Inspiration}
{key: Bb}

{start_of_verse: Verse 1}
[Bb]Upon the earth I [Cm]came to life in the [F7]world God prepared.
[Gm]One re[D]joicing [Gm]land of [Eb]freedom I am [F7]chosen to build,
[Bb]To re[F]veal the [Bb]Truth of [Eb]God, His [Bb]Purpose and His [F]Will.
[D]Sacri[Gm]fice your[Eb]self and [Bb]live all [Eb]for His De[Bb]sire, [Eb]all for [Bb6]His De[F7]sire.[Bb]
{end_of_verse}

{start_of_verse: Verse 2}
All Heaven sings a mighty song, inspiration divine,
For a new Eden begins now, spread the message to all.
Sacrifice yourself to build, our Lord's new world of life.
Seek the land of freedom now, all for His Desire, all for His Desire.
{end_of_verse}

{start_of_verse: Verse 3}
We seek the new eternal base, blessed family of God,
Long awaited by the Father, God of goodness above.
Now proclaim the great new Truth, of kindness and good will.
Pioneer new Heaven and earth all for His Desire, all for His Desire.
{end_of_verse}

{start_of_verse: Verse 4}
Within a day of bright new life, stand upholding the right;
In the pure new life eternal raise the standard of good.
Praise the Father of all good, our glorious true ideal;
Build a whole new world of peace, we will build it now, we will build it now.
{end_of_verse}`,
  },
  {
    title: "Garden of Restoration",
    songNumber: 4,
    themes: ["restoration", "providence", "hope"],
    origin: "carp-songbook",
    key: "C",
    chordProContent: `{title: Garden of Restoration}
{key: C}

{start_of_verse: Verse 1}
[C]In this [Am]world, em[C]bittered with [F]hate, through the [C]thousands of [F]years, [Em][G7]
[C]Father was [F]searching to [C]find One tri[Am]umphant in [Dm]heart; [G][G7]
[C]There, [G]where He [C]struggled be[F]hold, [Em]footprints [Am]stained with [Dm]blood; [G7]
[C]Such love is [F]given to [C6]us in [Em]His [Am]provi[Dm]dence;
[C]Such [F]love is [C]given to [Am]us in [F]His [Dm]provi[C]dence.
{end_of_verse}

{start_of_verse: Verse 2}
Here we find the flower of joy in the freedom of God;
His garden blesses the world with the blooming of hope;
Fragrant perfume of His will fills us all with joy;
Such life fulfills all the dreams of our Father's desire,
Such life fulfills all the dreams of our Father's desire.
{end_of_verse}

{start_of_verse: Verse 3}
Fresh bouquets of happiness grow, gently tossed in the breeze;
Our home eternal and true is a haven of joy;
Here in such beauty divine, we shall always live;
Such is the gift of the Lord, Father's heavenly land;
Such is the gift of the Lord, Father's heavenly land.
{end_of_verse}

{start_of_verse: Verse 4}
God's eternal providence is the Kingdom on earth;
On earth He wanted to see His true garden in bloom,
Filled with perfume of the heart, spread His glorious joy;
Such is the glory to come, crowning all of the world,
Such is the glory to come, crowning all of the world.
{end_of_verse}`,
  },
  {
    title: "Song of the Victors",
    songNumber: 6,
    themes: ["victory", "praise", "freedom"],
    origin: "carp-songbook",
    key: "F",
    chordProContent: `{title: Song of the Victors}
{key: F}

{start_of_verse: Verse 1}
[F]Sing a loud Ho[C7]sanna to the [Dm]Lord,
[Bb]Offer everything with [F]humble heart.
[Gm]Come at[Am]tend the [F]Lord, O rejoice in Him
Who brings [C7]new life to all the [F]world.
[Dm]Let us go de[Am]termined to seek and find
[F]All the [Bb]promised glory [F]of the Lord.
{end_of_verse}

{start_of_chorus: Chorus}
[Gm]There we'll sing [Am]new songs in the [Dm]Garden fair,
[Am]Songs of [Dm]freedom bright with happi[Am]ness.
[Bb]There we'll sing [Am]new songs in the Garden fair,
[F]Songs of [C7]freedom bright with happi[F]ness.
{end_of_chorus}

{start_of_verse: Verse 2}
There are clouds of darkness on the path,
Sinful night enveloping the land.
Brush the clouds aside and behold the light
That shines in beauty everywhere.
Let us go determined to seek and find
Our new world of joyfulness and peace.
{end_of_verse}

{start_of_verse: Verse 3}
Oh, my brothers all rejoice today,
You who sing the song of our new life.
Offer praise on high, blessed for evermore,
As chosen people of the Lord.
Let us go determined to seek and find
All the brilliant glory of our dreams.
{end_of_verse}

{start_of_verse: Verse 4}
We uphold the standard of the Lord,
To restore His true ideal.
Freely give your love, share the Father's joy,
And beauty will return to you.
Let us go determined to seek and find
Harmony within the Garden bright.
{end_of_verse}`,
  },
  {
    title: "The Lord Has Come",
    songNumber: 9,
    themes: ["Lord", "coming", "hallelujah"],
    origin: "carp-songbook",
    key: "C",
    chordProContent: `{title: The Lord Has Come}
{key: C}

{start_of_verse: Verse 1}
[C]O, the Lord is [F]come, [C]O the Lord is [Am]come!
[C]He has [C+]come to the [F]country of [D]God, [D7]shining in glorious [G]dawn.[G7]
[Am]Here is our [Dm]Leader and [C]Lord, filled with our [Am]Father's light.
[F]Leading all [C]men with His [F]Word, into the Purpose of God.
{end_of_verse}

{start_of_chorus: Chorus}
[C]Beautiful [C+]Father[Am6]land [C]welcome the [F]Lord! Come [Em]let us sing and re[G7]joice!
[C]Halle[F]lujah, [C]Halle[G7]lujah, [C]Halle[Em6]lujah! [G7]A[C]men!
{end_of_chorus}

{start_of_verse: Verse 2}
O the Lord is come, O the Lord is come!
He has come to the land of the pure, blessed with the blossom of life.
Here is our Ruler and King, bringing our Father's way,
Shattering evil and sin, building the Kingdom of God.
{end_of_verse}

{start_of_verse: Verse 3}
O the Lord is come, O the Lord is come!
He has come to the mountainous land, laden with treasure untold.
Here is our saviour and God, showing our Father's Heart.
Lifting us high with His joy, into the glory of God.
Come O my brothers and welcome the Lord!
Come let us sing and rejoice!
Hallelujah, Hallelujah, Hallelujah! Amen!
{end_of_verse}`,
  },
  {
    title: "My Offering",
    songNumber: 10,
    themes: ["offering", "sacrifice", "dedication"],
    origin: "carp-songbook",
    key: "Eb",
    chordProContent: `{title: My Offering}
{key: Eb}

{start_of_verse: Verse 1}
Now I have to come to know, I've truly come to know,
[Ab]Father, how your [Bb]heart is filled with [Eb]tears,
[Eb]For your altar stands and [Bb]waits for an [Eb]offering never made.
[Ab]He cries through [Eb]all the [Ab]ages for [Bb]still no offering [Eb]comes,
Our Father cries in loneliness for He cannot share His heart.
{end_of_verse}

{start_of_verse: Verse 2}
Now I have come to know, I've truly come to know,
Father, now I know your blessed grace;
For you raised me from the darkness and gave to me new life.
I live and stand before you, but now you cry again.
My Father has to say to me, "Go and die now in my place."
{end_of_verse}

{start_of_verse: Verse 3}
Now pledging I will go, determined I will go,
Father, now I'm changing to Your way,
For no other will I follow, but go my Father's way
Upon Your waiting altar I kneel without a word.
My life shall be the sacrifice; I will faithfully obey.
{end_of_verse}`,
  },
  {
    title: "Unite Into One",
    songNumber: 11,
    themes: ["unity", "world", "peace"],
    origin: "carp-songbook",
    key: "Bb",
    chordProContent: `{title: Unite Into One}
{key: Bb}

{start_of_verse: Verse 1}
[Bb]Chase away the [Eb]power of [Bb]Satan, far away be[F7]yond the land and sea;
[Bb]Build for God a [Eb]boundless [Bb6]Kingdom, giving [F7]joy and liberty to [Bb]all.
[F]Come, ye [Bb]people all a[Eb]round the world, [F]let's unite into one;
[Bb]Spreading [F]forth the [Bb]glory [F]of the [Bb]Father, and His [F]great will [F7]forever[Bb]more.
{end_of_verse}

{start_of_chorus: Chorus}
Unite, Unite, let's unite into one
[Bb]Bring a[F]bout one [Bb]nation [F]uniting [Bb6]all the [F7]people of the [Bb]world.
{end_of_chorus}

{start_of_verse: Verse 2}
Raise the white cross on our banner, high upon Mt. Everest it waves;
In the blue Pacific waters, cleanse the sword that brought the victory.
Come, ye people all around the world, let's unite into one.
Now resolve to end the deep resentment, of the long centuries past.
{end_of_verse}

{start_of_verse: Verse 3}
Build a fortress to defend the peace, on the great new heaven and new earth;
We will all sing 'Hallelujah,' safe within the bosom of the Lord.
Come, ye people all around the world, let's unite into one.
Share the joy and glory of Heaven, hidden so long from every eye.
{end_of_verse}`,
  },
  {
    title: "Call to Sacrifice",
    songNumber: 13,
    themes: ["sacrifice", "soldiers", "dedication"],
    origin: "carp-songbook",
    key: "D",
    chordProContent: `{title: Call to Sacrifice}
{key: D}

{start_of_verse: Verse 1}
[D]Come unite the [Bm]world you [G]soldiers of [D]Truth,
[Bm]Chosen by the [A]Lord to [D]carry His [G]Word.[A7]
[D]Till the world pro[Bm]claims Him [G]ruler of [D]all,
[F#m]Every [Bm]soldier must go [A7]forward to [D]fight.
[G]Offer God your [D6]life and de[A7]sire, Uniting both the body and soul,
[D]We shall be the [Bm]soldiers who [G]can ful[D]fill,
[F#m]Everything for [Bm]God by [A7]doing His [D]Will.
{end_of_verse}

{start_of_chorus: Chorus}
[G]Join the [D]fight for the [G]Lord, [D]sacri[Em]ficing [Bm]all that you [A]have
[D]Join the [G]fight, win the [D]world! [G4]We will [A7]see vic[D]tory!
{end_of_chorus}

{start_of_verse: Verse 2}
Come unite the world you soldiers of light,
Called to be the chosen people of God.
Till the world returns all glory above,
Every soldier must go forward to march.
Offer God the wealth you possess,
Uniting from beginning to end,
We shall be the soldiers who can fulfill,
Heavenly desire by doing His will.
{end_of_verse}

{start_of_verse: Verse 3}
Come unite the world you soldiers of right,
Trusted by the Lord as worthy in heart,
Till the world is bright with Heavenly joy,
Every soldier must go forward to win.
Offer God the love in your heart,
Uniting on the left and the right,
We shall be the soldiers who can fulfill,
God's eternal joy by doing His will.
{end_of_verse}

{start_of_verse: Verse 4}
Come unite the world you soldiers of life,
Ever to obey our Father's command,
Till the world returns His Heavenly love,
Every soldier must go forward in faith.
Offer God the people you love,
Uniting both the young and the old,
We shall be the soldiers who can fulfill,
One united world by doing His will.
{end_of_verse}`,
  },
  {
    title: "Light in the East",
    songNumber: 18,
    themes: ["light", "east", "righteousness"],
    origin: "carp-songbook",
    key: "C",
    chordProContent: `{title: Light in the East}
{key: C}

{start_of_verse: Verse 1}
[C]Light that drives out the [F]darkness is shining [G]brightly from the East.
[C]Sons and [E7]daughters of [F]light are dwelling in the [C6]Garden [G]there.[G7][C]
[F]This is [C]God's land of [D7]righteous[G]ness, chosen by Him to do His will;
[C]These are [F]God's people, [C]chosen [Am]ones, up[D]right in [D7]mind and [G]heart.[G7]
{end_of_verse}

{start_of_chorus: Chorus}
[C]As we [E7]now receive the [F]love of God, our [Am]boundless source of [Em]light,[G7]
[C]Come, [E7]let's join to[F]gether and in [C]brightness we shall [F6]live;[Dm6][G][G7]
[C]We'll [E7]shine like the [F]brightest star to [C6]all of [G7]heaven and [C]earth!
{end_of_chorus}

{start_of_verse: Verse 2}
Good that wins over evil is now uniting in the East.
People longing for good are dwelling in the garden there.
Country of prayer and holy life, honoring God eternally;
People who wear the robe of white, sacrificing for the Lord.
{end_of_verse}

{start_of_verse: Verse 3}
Love that ends all the hatred is now to blossom in the East.
Men refusing to sin are dwelling in the garden there.
Ridiculed and rejected land, separates good from sinfulness;
People who know the thorny path knowing God's wondrous love.
{end_of_verse}

{start_of_verse: Verse 4}
Greatest victory eternal is now beginning in the East.
Those who crush evil ways are dwelling in the garden there.
Country divided North and South truly knows good from sinfulness;
People who shed their precious blood, given for the sins of men.
{end_of_verse}

{start_of_verse: Verse 5}
Brilliant glory of Heaven now comes in power from the East.
Those who carry the cross, are dwelling the garden there.
Country where soon the Sun will rise, welcoming soon the Son of Man;
There the bright Rose of Sharon blooms, beautiful garden of God.
{end_of_verse}`,
  },
  {
    title: "My Promise",
    songNumber: 20,
    themes: ["promise", "dedication", "service"],
    origin: "carp-songbook",
    key: "C",
    chordProContent: `{title: My Promise}
{key: C}

{start_of_verse: Verse 1}
[C]I pledge [G]I will [Am]go, [G]I pledge I will [D]go; [G][G7]
Go as my [C]Father [G7]has [C]gone.
[F]Tears fall [Em]on the path,
[Am]Lonely and [F]silent the [Am]path of the [Em]Father,
[F]Going to [G]suffer the [Am]way of the [G]Cross.
[Am]Ready to [E7]follow His [F]will.
[C]I pledge [E]I will go [F]forward to [G]Him; [G7][C]
[Am]Ready to [E]follow His [F]will,
[C]I pledge [F]I will go [C]forward to [G7]Him.[C]
{end_of_verse}

{start_of_verse: Verse 2}
I'll follow the way, I'll follow the way;
Follow the path of my Lord.
Though thorny the path,
Now persevere as the brightness is growing,
On to the victory and glorious crown,
Giving my body and soul,
I'll follow the Lord all of the way;
Giving my body and soul, I'll follow the Lord all of the way.
{end_of_verse}

{start_of_verse: Verse 3}
I'm ready to serve, I'm ready to serve.
Serving my Father's desire,
Trials darken the path,
Deep in my heart the desire of the ages,
Fighting until we come home to the Lord,
Satan will bow in defeat,
I'm ready to serve all of my life;
Satan will bow in defeat, I'm ready to serve all of my life.
{end_of_verse}`,
  },
  {
    title: "Be Thou My Vision",
    songNumber: 50,
    themes: ["vision", "Lord", "devotion"],
    origin: "carp-songbook",
    key: "D",
    chordProContent: `{title: Be Thou My Vision}
{key: D}

{start_of_verse: Verse 1}
[D]Be Thou my [Bm]vision, O [G]Lord of my [D]heart; [A][D]
[A]Naught be all [D]else to me, [G]save that Thou [A]art--
[G]Thou my best [D]thought, by [G]day or by [A]night,
[D]Waking or [G]sleeping, Thy [A]presence my [D]light.
{end_of_verse}

{start_of_verse: Verse 2}
Be Thou my wisdom and Thou my true word,
I ever with Thee and Thou with me, Lord;
Thou my great Father, and I Thy true son;
Thou in me dwelling, and I with Thee one.
{end_of_verse}

{start_of_verse: Verse 3}
Riches I heed not, nor man's empty praise,
Thou mine inheritance, now and always;
Thou and Thou only, first in my heart,
High king of heaven, my treasure Thou art.
{end_of_verse}

{start_of_verse: Verse 4}
High king of heaven, my victory won,
May I reach heaven's joys, O bright heav'n's sun!
Heart of my own heart, whatever befall,
Still be my vision, O ruler of all.
{end_of_verse}`,
  },
  {
    title: "I Come To The Garden Alone",
    songNumber: 100,
    themes: ["garden", "devotion", "Jesus"],
    origin: "carp-songbook",
    key: "G",
    chordProContent: `{title: I Come To The Garden Alone}
{key: G}

{start_of_verse: Verse 1}
[G]I come to the garden alone,
[C]While the dew is [G]still on the roses;
[D]And the voice I [G]hear, falling on my ear,
[A7]The Son of God dis[D]closes.
{end_of_verse}

{start_of_chorus: Chorus}
[G]And He walks with me, and He [D]talks with me,
[D7]And He tells me I am His [G]own,
[G]And the [G7]joy we share as we [C]tarry there,
[G]None [D7]other has ever [G]known.
{end_of_chorus}

{start_of_verse: Verse 2}
He speaks, and the sound of His voice,
Is so sweet the birds hush their singing,
And the melody that He gave to me,
Within my heart is ringing.
{end_of_verse}

{start_of_verse: Verse 3}
I'd stay in the garden with Him,
Though the night around me be falling,
But He bids me go; through the voice of woe,
His voice to me is calling.
{end_of_verse}`,
  },
];

/**
 * Seed the database with CARP Song Book songs
 * Run with: npx convex run seedCarpSongs:seedCarpSongs
 */
export const seedCarpSongs = mutation({
  args: {},
  handler: async (ctx) => {
    // Get or create a system user
    let systemUserId: Id<"users">;
    const existingUsers = await ctx.db.query("users").take(1);

    if (existingUsers.length > 0) {
      systemUserId = existingUsers[0]._id;
    } else {
      systemUserId = await ctx.db.insert("users", {
        name: "HSA Songbook",
        email: "system@hsasongbook.app",
      });
    }

    // Track results
    const results = {
      songsCreated: 0,
      arrangementsCreated: 0,
      skipped: [] as string[],
    };

    // Insert songs and arrangements
    for (const song of CARP_SONGS) {
      // Check if song already exists by title
      const existingSong = await ctx.db
        .query("songs")
        .withIndex("by_title", (q) => q.eq("title", song.title))
        .first();

      if (existingSong) {
        results.skipped.push(song.title);
        continue;
      }

      // Create the song
      const songSlug = slugify(song.title);
      const songId = await ctx.db.insert("songs", {
        title: song.title,
        themes: song.themes,
        origin: song.origin,
        slug: songSlug,
        createdBy: systemUserId,
        ownerType: "user",
        ownerId: systemUserId.toString(),
      });
      results.songsCreated++;

      // Create an arrangement for the song
      const arrangementSlug = nanoid(6);
      await ctx.db.insert("arrangements", {
        songId,
        name: "Original",
        key: song.key,
        chordProContent: song.chordProContent,
        slug: arrangementSlug,
        createdBy: systemUserId,
        favorites: 0,
        tags: [`carp-${song.songNumber}`],
        ownerType: "user",
        ownerId: systemUserId.toString(),
      });
      results.arrangementsCreated++;
    }

    return {
      success: true,
      message: `Created ${results.songsCreated} songs and ${results.arrangementsCreated} arrangements. Skipped ${results.skipped.length} existing songs.`,
      ...results,
    };
  },
});

/**
 * Clear only CARP Song Book songs (by origin)
 * Run with: npx convex run seedCarpSongs:clearCarpSongs
 */
export const clearCarpSongs = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all songs with carp-songbook origin
    const songs = await ctx.db.query("songs").collect();
    const carpSongs = songs.filter((s) => s.origin === "carp-songbook");

    let arrangementsDeleted = 0;
    let songsDeleted = 0;

    for (const song of carpSongs) {
      // Delete arrangements for this song
      const arrangements = await ctx.db
        .query("arrangements")
        .withIndex("by_song", (q) => q.eq("songId", song._id))
        .collect();

      for (const arr of arrangements) {
        await ctx.db.delete(arr._id);
        arrangementsDeleted++;
      }

      // Delete the song
      await ctx.db.delete(song._id);
      songsDeleted++;
    }

    return {
      success: true,
      message: `Deleted ${songsDeleted} CARP songs and ${arrangementsDeleted} arrangements`,
      songsDeleted,
      arrangementsDeleted,
    };
  },
});
