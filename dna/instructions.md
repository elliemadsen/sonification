INSTRUCTIONS

I want to create a sonification of Pinna Nobilis DNA.
Feel free to use whatever is best, perhaps a python script.
I don't have an image of what I want it to sound like. You could create a few options.
I already created an image to sound generator in the top level directory.
Perhaps you could make a new version of this with an interface where I can edit.
If it's easier to do in python instead of javascript, you could just make a python script instead and no interface.
The output should be a video with the sound. The visual should animate the DNA sequence moving right to left to show what part of the sequence is currently playing. You can also use the Y axes to represent pitch.
As far as how the DNA is translated to sound (scale, pitch, chord, reverb, and so on) I just want to experiment with different things.
Please also store the gene data in a different file to be read from.

DATA

Record 3: PZ220846.1 — Complete mitochondrial genome (18,916 bp)
This is a complete mitochondrial genome (mitogenome) sequenced with PacBio long-read technology at 1,200× coverage, assembled with Flye. Submitted in March 2026 from a French team. It contains:
13 protein-coding genes (cox1, cox2, cox3, nad1–6, cob, atp6, nad4l)
2 ribosomal RNA genes (12S and 16S rRNA)
22 tRNA genes
The full circular mitochondrial chromosome

Pinna nobilis isolate B18 mitochondrion, complete genome
GenBank: PZ220846.1

FASTA Graphics

Go to:
LOCUS PZ220846 18916 bp DNA circular INV 04-APR-2026
DEFINITION Pinna nobilis isolate B18 mitochondrion, complete genome.
ACCESSION PZ220846
VERSION PZ220846.1
KEYWORDS .
SOURCE mitochondrion Pinna nobilis
ORGANISM Pinna nobilis
Eukaryota; Metazoa; Spiralia; Lophotrochozoa; Mollusca; Bivalvia;
Autobranchia; Pteriomorphia; Pterioida; Pinnoidea; Pinnidae; Pinna.
REFERENCE 1 (bases 1 to 18916)
AUTHORS Coupe,S., Bunet,R., Foulquie,M. and Vicente,N.
TITLE Direct Submission
JOURNAL Submitted (23-MAR-2026) Universite de Toulon, Aix Marseille Univ,
CNRS, IRD, MIO, Marseille, France, Universite de Toulon, CS 60584,
TOULON Cedex 9, Var 83041, France
COMMENT ##Assembly-Data-START##
Assembly Method :: flye v. 2.9.5-b1801
Assembly Name :: mitogenome_Pinna_nobilis_B18
Coverage :: 1200
Sequencing Technology :: PacBio
##Assembly-Data-END##
FEATURES Location/Qualifiers
source 1..18916
/organism="Pinna nobilis"
/organelle="mitochondrion"
/mol_type="genomic DNA"
/isolate="B18"
/db_xref="taxon:111169"
gene 1..699
/gene="cox2"
CDS 1..699
/gene="cox2"
/codon_start=1
/transl_table=5
/product="cytochrome c oxidase subunit 2"
/protein_id="YDQ29498.1"
/translation="MSLWGQIGYQDALSPESCRIQWAYDLMFTTMVGILVVVLGGLFS
VVMGRETYLIVVRKEWVEFLWTFVPICILANLSQPSILLLYKLCEMQSPLATVKCVGH
QWYWSYEVSDGGMIVKFDQYMKPEDSLVEGEYRLLEVDKRLVLPCKVWLRMLTASEDV
IHCWTVPCLGVKCDAVPGRLNEVPMSISLPGVYYGQCSEICGANHSFMPIVVEAVMPS
FYDGWLSAVGEEIE"
gene 749..820
/gene="trnI(gat)"
tRNA 749..820
/gene="trnI(gat)"
/product="tRNA-Ile"
gene 838..903
/gene="trnV(tac)"
tRNA 838..903
/gene="trnV(tac)"
/product="tRNA-Val"
gene 907..981
/gene="trnK(ttt)"
tRNA 907..981
/gene="trnK(ttt)"
/product="tRNA-Lys"
gene 994..1067
/gene="trnE(ttc)"
tRNA 994..1067
/gene="trnE(ttc)"
/product="tRNA-Glu"
gene 1092..1158
/gene="trnP(tgg)"
tRNA 1092..1158
/gene="trnP(tgg)"
/product="tRNA-Pro"
gene 1175..1243
/gene="trnF(gaa)"
tRNA 1175..1243
/gene="trnF(gaa)"
/product="tRNA-Phe"
gene 1319..1394
/gene="trnD(gtc)"
tRNA 1319..1394
/gene="trnD(gtc)"
/product="tRNA-Asp"
gene 1495..1953
/gene="nad6"
CDS 1495..1953
/gene="nad6"
/codon_start=1
/transl_table=5
/product="NADH dehydrogenase subunit 6"
/protein_id="YDQ29499.1"
/translation="MLGLYVMQSRQPLVLFFSVVLAAVALCCSLGLSGVKLKAYMIFM
VYIGGLFVLFGYMVSLIPMDLGGSRYMLWGPMLSGIGLTLGVLFVLSKETGCAVELGL
MSDFSIFVCPLAVGLAVILLLVMIAVVKISDLDKGCLRHSLKGNLRSSRM"
gene 2402..2479
/gene="trnR(tcg)"
tRNA 2402..2479
/gene="trnR(tcg)"
/product="tRNA-Arg"
gene 2778..3125
/gene="nad3"
CDS 2778..3125
/gene="nad3"
/codon_start=1
/transl_table=5
/product="NADH dehydrogenase subunit 3"
/protein_id="YDQ29500.1"
/translation="MSVPLLVSAGASGLMMWMGGYLGGYYSSGESGKSSAYECGFSGV
EGAWIPFSLHFFHFAILFVVWDVEVVLLIPLMKVMSLGVGASIWSLWGFLVVLWVGLV
YEWMEGSLTWVRF"
gene 3140..3210
/gene="trnN(gtt)"
tRNA 3140..3210
/gene="trnN(gtt)"
/product="tRNA-Asn"
gene 3277..3347
/gene="trnC(gca)"
tRNA 3277..3347
/gene="trnC(gca)"
/product="tRNA-Cys"
gene 4513..4585
/gene="trnM(cat)"
tRNA 4513..4585
/gene="trnM(cat)"
/product="tRNA-Met"
rRNA 4748..5534
/product="12S ribosomal RNA"
gene 5619..5688
/gene="trnG(tcc)"
tRNA 5619..5688
/gene="trnG(tcc)"
/product="tRNA-Gly"
gene 5705..5773
/gene="trnH(gtg)"
tRNA 5705..5773
/gene="trnH(gtg)"
/product="tRNA-His"
rRNA 5830..7185
/product="16S ribosomal RNA"
gene 7203..7272
/gene="trnL2(taa)"
tRNA 7203..7272
/gene="trnL2(taa)"
/product="tRNA-Leu"
gene 7275..8210
/gene="nad1"
CDS 7275..8210
/gene="nad1"
/codon_start=1
/transl_table=5
/product="NADH dehydrogenase subunit 1"
/protein_id="YDQ29501.1"
/translation="MVFYTVEMVSVYLCVFLAVAFFTLLERKALASFHLRKGPNKVGF
GGIPQPLADALKLFTKELPIPRVGLSWLFYVCPGLALLVMMLLWWMYPVFYCLSTGQM
SVLFFICVSSMNAYVLMFAGWSSNSKYAGLGAVRAFAQSISYEVSMSLILLFAVVLHG
SFNLFSIQKSGQYMWYGLIWWPVTISWLVSCLAETNRTPFDFVEAESELVSGYNVEYG
GGGFASLFIAEYGSIMFISFLTVSVFFSNYWPCFHFWAGLFLFFKAMMICYWFIWVRA
SFPRLRYDMLMELMWKSILPGCLASWMALVLYSVM"
gene 8231..8300
/gene="trnL1(tag)"
tRNA 8231..8300
/gene="trnL1(tag)"
/product="tRNA-Leu"
gene 8317..8385
/gene="trnQ(ttg)"
tRNA 8317..8385
/gene="trnQ(ttg)"
/product="tRNA-Gln"
gene 8387..8698
/gene="nad4l"
CDS 8387..8698
/gene="nad4l"
/codon_start=1
/transl_table=5
/product="NADH dehydrogenase subunit 4L"
/protein_id="YDQ29502.1"
/translation="MSLISDLTAWWSLSWLGLTFSFFCVIGACNKQRHLLAFLMLMEG
CSMGIAVSIAGLGEWVNFGFFMVFLTFSACETSVGLSFLVGLIRATRSGYVRGQSMMA
C"
gene 8692..10056
/gene="nad4"
CDS 8692..10056
/gene="nad4"
/codon_start=1
/transl_table=5
/product="NADH dehydrogenase subunit 4"
/protein_id="YDQ29503.1"
/translation="MLASVVGSAWLVALSSMKLMKKEGRWFMVSWGLMITALLVLLDG
IPWGVNCMMETEEMSVDLASCWFIILSAWLSSMVLLVSVRGVLHKGGEGMGYVTTVFF
LTFFLIFCFAASDIFWFYVFYEATLIPTSMLILGWGDQPERLEAARYMICYTVMCSAP
LFFAFMWLGWGEGSFFMWFVGYKSALSGWLWMALSLGLLVKLPIFPLHVWLPKAHVEA
PLGGSLLLAGILLKMGGYGLFRVMSAFGYVLEVFGMVVVSFCLWGGVYTSMACVRQVD
VKALIAYSSVGHMGVACAGIFSSTEAGWNAGMGLMLVHAFVSCGLFTLASYGYEAVKS
RSIFLMKGLCCIYPSMAAFWFIFCVLNMGCPPSLGLLSEMIISGILTEGGGVLGLVPF
VILLFFGGAYNLYLYSETQHGIPMDGGYSEKYSVSDYACLSGFLFWSLVLVLKGSVVL
GWVF"
gene 10279..11988
/gene="nad5"
CDS 10279..11988
/gene="nad5"
/codon_start=1
/transl_table=5
/product="NADH dehydrogenase subunit 5"
/protein_id="YDQ29504.1"
/translation="MPFLFAGIFLTFVSFTVLWLSWGPEKPLMVIMGVDFMDLCFAGV
ALGVSLSVIKVIYLMAVSGIVMCTSSFSESYMSGDVHKDRMTDLVFVFVLAMFTVVSA
ENVFTMVLGWEGLGVSSYGLIIYYQDKPALNAGYLTSMSMRVGDLLFIIMVGVLVGVG
EFSLVSGLASMGTVLCVCCMTKSATVPFCAWLPAAMSAPTPVSALVHSSTLVTAGVCF
LIESYSCIEGSVGQEILIFGSLVTMALAGSSALWENDLKKIVALSTMGQVSFMVFTIG
IGMPILAFFHMLVHAFIKAGMFISVGVLIHANMGEQDLREFDSGILCAHPLAVGGLVS
GSLSLMGIPMLSGFYSKEAIVMALNSCPYSICFYTLFYLGAVLTTSYSCRLVISLGVK
CKSKMVSGGVPSDCGYTDFPISFLFTLSLFGGMLFWAVAVDGSGWFGSMVLGPEFIFK
VMMVAVLFGIFTCEAEEAGVWSSNLMSWNSEKVGFFYSMWYFGGVSGQPFVEGFKKCS
DWMVPGMEYWSEQVAAKGLWDLGSAYFSGVHRPIQTNEVFIPWFFLTGAIFVCCLVGF
LMG"
gene 12015..12086
/gene="trnS1(tct)"
tRNA 12015..12086
/gene="trnS1(tct)"
/product="tRNA-Ser"
gene 12104..13126
/gene="nad2"
CDS 12104..13126
/gene="nad2"
/codon_start=1
/transl_table=5
/product="NADH dehydrogenase subunit 2"
/protein_id="YDQ29505.1"
/translation="MMARHVVYLVLAFMIGALSLFQSSPYMVWASFELNLFMISPFLL
NREQFAHPTKGAIIYFGCQSIASVYMIGGAILQDLGWSGGSFFFLSGFFCKLGVFPFY
SWVPRTMVSLSWMSCLVLMTVQKLFPILCVPSVNTDSLLGWWFAVSLGISALVAGSMM
FFQTNLKAGLAYSSVLNMSWVLSLKLSSESGSGLFSVNTLVAGYLLLYFLVVLSVVSV
FMLTQVQTLADVALFQWGRFRWVSYLGILSLSGVPGLMGFLPKAMVVMVVVSFSPILI
AALLLSSAFSILWYTTPVAMAGVSQPAYSEADMSKGARLSCYMSSWLNLSGIPFLFLL
YFFCFF"
gene 13428..13496
/gene="trnY(gta)"
tRNA 13428..13496
/gene="trnY(gta)"
/product="tRNA-Tyr"
gene 13519..13592
/gene="trnT(tgt)"
tRNA 13519..13592
/gene="trnT(tgt)"
/product="tRNA-Thr"
gene 13594..15174
/gene="cox1"
CDS 13594..15174
/gene="cox1"
/codon_start=1
/transl_table=5
/product="cytochrome c oxidase subunit 1"
/protein_id="YDQ29506.1"
/translation="MTEFFKNSGWVYRWVCSTNHKDIGTLYLLLGLWSGMVGTGFSVI
IRTELCRPGAGFLGDGQLYNSIVTAHAFIMIFFFVMPMMIGGFGNWLIPLMMGVPDMA
FPRLNNLSFWLLPSSLYCLFLSAFVEGGAGTGWTIYPPLSTYLYHGMAVDLAIFSLHL
AGLASIFGGINFIVTAQNMRRMESHLMDLFPWAVLVTAVLLVVSLPVLAGGITMLLTD
RHFNTSFYFPGGGGDPVLFQHLFWFFGHPEVYILILPAFGMISHMVCHWSFKLEVFGG
LAMIYAMLGIGALGFLVWGHHMFTVGMDVNSRAYFSAATLIIAVPTGVKVFSWIATMS
GCRLKTSAPVLWSVGFLGLFTFGGLTGVILASASVDIVLHDTYFVTGHFHYVLSMGAV
FALFGAFNHWFPLFTGLSLHRRLAKSQFIGMFIGVNLTFFPHHFLGLSGMPRRIIDYP
DCFAKWNSVSSWGSMLSFVGLMWFSFILWEAFIAQRPLLFMNNVSVFLEWMGGAKLPP
ASHGWLLEAPSLWSKRAR"
gene 15246..16070
/gene="cox3"
CDS 15246..16070
/gene="cox3"
/codon_start=1
/transl_table=5
/product="cytochrome c oxidase subunit 3"
/protein_id="YDQ29507.1"
/translation="MVGYTLKVKSGSSLPRVPWHLVDPSPWPFTTSVSLLCVVLGLTS
WMNGRDWSIIIYGAVLLSISVVSWFRDIVIEATFQGMHTKPVQNGLKLGFKLFLLSEL
MLFFSFFWAFMHSALSPSVEVGCCWPPAGLTTLNPWQDAAVNTCILLTSGASVTWSHK
AMKAGIMSESYMGLLQTIGWGCLFTYSQYQEYSVCPFTIADSVYGSCFFMLTGLHGLH
VIGGTSFLIASLFRMGRRHFSTGHHLGYVFAIWYWHFVDIMWLFVWGIVYIWGSWM"
gene 16125..16190
/gene="trnS2(tga)"
tRNA 16125..16190
/gene="trnS2(tga)"
/product="tRNA-Ser"
gene 16211..16279
/gene="trnA(tgc)"
tRNA 16211..16279
/gene="trnA(tgc)"
/product="tRNA-Ala"
gene 16959..17025
/gene="trnW(tca)"
tRNA 16959..17025
/gene="trnW(tca)"
/product="tRNA-Trp"
gene 17031..17765
/gene="atp6"
CDS 17031..17765
/gene="atp6"
/codon_start=1
/transl_table=5
/product="ATP synthase F0 subunit 6"
/protein_id="YDQ29508.1"
/translation="MIAGSLMSIFYEGSGWWPETHMLLFFLPGFILCTEYRGLVASTC
GVAGGLMFPLGKKLFDEKVGGMFLFPSLFMASFLMVLFNCLMGTVPWSYPVMAHWSVT
CTVTFPLWLGLYVSCLRSGPVGFFASLVPKGVPELFGFFIFPIEIVSILCQIVSLSVR
MMLNMAFGFMIIHVVMSILSSIVLGSGASVGGVMMVLVASGVLVAEFFVCMIQSGLLF
GLLCMYSANHPGSMGYASCYCSVTEK"
gene 17731..18897
/gene="cob"
CDS 17731..18897
/gene="cob"
/codon_start=1
/transl_table=5
/product="cytochrome b"
/protein_id="YDQ29509.1"
/translation="MRRAIVPLRKSNSILKAVNGAVWELPCAPNLNMWWNFGSCLGIL
LATQIVSGMLLAIHYTAYESISFESVKFIMRDVNYGWLIRGIHSNGASVFFVCLYLHI
GRGLYYASYSSLLAVWNVGVVLYLMSMAIAFLGYVLPWGTMSFWGATVITNLFTVVPY
VGNTLVYWMWGGYSVSGPTLKRFFVLHFFLPLAMVVVVMLHLLYLHEGGSNNPLGISS
DVLAVRFHPFYTSKDLVGLAIVYGAFGFLALGFPDLLSNYLNNVPVDALRTPRHIEPE
WYFLYAYAILRSVPHKTVGIIAMLMAILVMVVLPYIDSSKCRGLEYYPLSQFLFWTFV
ANWALLGWIGSMPPKGVCYDYGQWFTVFHLGYFGLLVVFNMMWDKWLFMEEGEL"
ORIGIN  
 1 gtgagattgt gaggtcagat tgggtatcaa gatgctctta gacccgagag atgtcgaatt
61 caatgggcgt acgacttaat gtttacgact atggttggga ttttagtagt ggttttggga
121 gggctttttt ctgttgttat gggtcgagag acttatctga ttgttgttcg aaaagagtga
181 gtggaatttt tgtggacctt tgttcccatt tgtattttgg ctaacttgag tcagccatct
241 attttactac tttacaaact ttgtgagata caaaggcctt tggcaactgt taagtgtgtc
301 ggtcatcagt ggtactgaag gtacgaggta agagatggtg gtatgattgt aaaattcgat
361 cagtatatga aaccagaaga taggcttgtt gagggtgagt atcgtctttt agaagttgat
421 aagcggcttg tgcttccttg caaagtttga cttcggatgc taacagcgtc tgaggatgta
481 attcactgct gaactgtgcc ttgcttaggc gtgaagtgcg atgctgttcc tgggcgattg
541 aatgaggttc ctataagaat taggttacct ggggtctact atggccagtg ctctgaaatt
601 tgcggagcta atcatagatt catgcctatt gtagtcgaag ctgtaatgcc ttctttttat
661 gatgggtggc taagggccgt aggggaggaa attgagtaag gagagatgag ttttaagaga
721 gttagtgagc tagattatta agtgggaaaa catcgtgcta gagactaaag taggctactt
781 tgatgtggta gaaaatgggt ttactgaagc cccgatgttt actaaagtgc tggtccggaa
841 gatagcataa caaaatgtgc ctcgtttacg ccgaggacat gtggccaagt ttagccgctc
901 ttctgtgttg aagtagctta atatgtaaga gcgtctgact tttaatcaga agagtggaag
961 aataaggtcg tcccttcgac atggaggaag cattctcacg aggtgtactt tgtagcacat
1021 caggctttca tcctggagga gtgaacattt agaaatcacc gggagatgga atgggctcta
1081 aatctgtctc acaaatggta gtttaagaag aattgtcgct ttgggagcga taggtccctg
1141 atgtgttggg ccttttgata ggggattaag taatagttgg gtagcctaat gaataagggc
1201 gtgacactga agatgtcaag gaggctaata gagccctcaa cttaggccca ttgaaggaga
1261 acaggccgag ggctgtgtta gcattaaaca ggtcagccct tatactaggg ttatgttggg
1321 ggggttagtt ttataaaaat taaaattcaa ggttgtcagc cttgggaagc caggctaata
1381 acgggcactc cctaagtatg aagggtctac ggccatgaag atgaggaaga gtacgtggtg
1441 gaaaaaacca ggttgattag aaaggcatcc ttgttgtttt taggacctgt agtaatgtta
1501 ggtctgtatg taatacagtc acgtcagcca ttggtattat ttttcagggt ggttttagcg
1561 gcagtagcat tatgttgcag gttaggatta aggggagtaa agttaaaggc ttatatgatt
1621 tttatggttt atatcggcgg tctttttgtt ttatttggtt acatagtatc tttaattccg
1681 atggatcttg gcggaagccg ttatatatta tgagggccaa tgttaagggg aattgggcta
1741 actttggggg ttctcttcgt gttaagaaaa gagacgggtt gtgcagtgga attggggctt
1801 atgagagact ttagcatttt tgtttgtcca ttagccgtag gactggctgt gattctacta
1861 ttggttataa ttgccgtagt taaaatcaga gatttggata aaggctgctt gcggcatagc
1921 ttaaaaggta atttgcgttc ctcacgcatg tagagtagct aggttctgta tagtaacatt
1981 aaaaaagaaa aatatcttcc ttttgaaaaa aatccttttt tttgtgattt ttcgtgaaaa
2041 tttccgattt ttttcgcaaa tttgagtgtt ttttcgcgtt ttgaaaaaac atgcaatatt
2101 ttgataggca aaactggtta gataaatgga gattttggat caatataccc cccctctcaa
2161 aaaaaaaaaa aaaaaaagga gtaagctgta aatagttatg aaactaatag taaaaaaatg
2221 atttttttta aaatttaaag tagcatattc ttaaatagct agggttgaag ataattaatc
2281 agtggaatac tctgttaaga caagcaataa tcgaatagag ttgagaacaa agctgaaaaa
2341 tgtgaagttc tggtgaagtg aactgagcgg agaagggaat gtggtaagca tggttatgtg
2401 gagggaggaa gcgaagtgtt tgcgttcggt ttcggcccga aagatggtct agccagaagt
2461 aagaagtggc ccctctcttt gtggatttaa agaaagcgtt taaaaagttt ataggttttg
2521 ttagaaaaac tacgcggaga gtagaagcct ggcgtggttg agataagttg ggtgagttct
2581 tgcagagtgc ttatgtttgg ggcggactgg caaggatttt gggtgtagtg attcgcctag
2641 ggggttggct ctctatagcg gtttgaaagt tttgggctgt tgtgggtgct agaacagtgt
2701 gggctcatgt gcttctcaat tattgggtgt tgggctggct atggttcttc ttctttgtct
2761 ctaaggttcc tggaggtgtg agggttccat tgcttgtgag tgctggcgcc tcggggctca
2821 taatatggat aggcgggtac ctggggggct actattccag aggtgagtct gggaagagaa
2881 gagcatatga gtgtgggttt tcaggggtag aaggggcgtg gatccctttt tctttacatt
2941 tctttcactt tgctattttg ttcgtagtgt gggacgtgga agtagtctta ctgatccctt
3001 taataaaagt aatgagtttg ggcgttgggg cgaggatttg aagcctgtgg ggattcctag
3061 tagtgttatg agtagggctg gtttatgagt ggatggaggg gtccctaacc tgggtccgct
3121 tttaactttg aaactggagg agctcgtagc ataataaaat gctcccgtct gttaaatggg
3181 aatatgtgaa agtagatttt accgatctcg gctaagaagt aagcaacggg tcgtatataa
3241 cggtttaaac ttgcgggcag gaatggacga tgctgctcgt atagtctaag tcgataagat
3301 gacggcttgc aaggccgtgg atacggcgaa aaaggcatcc gttgcgagat gtgagggtag
3361 tcggttatct ggcacccaag ccgtattctg cgagtaattg tgagtccgag gtggaatgta
3421 atttgcatgg ggagtgtgct ggcaagctgg ttagtgttat taaacacgtt gctccgtatt
3481 gggggggccg gaagtggcgt tgcccttcgg gttttaaggg acacggtttt ctgttttaag
3541 agcctgttgt gagctggcct gtctcaatta agtggggata gcgaaatatt gtatgttgga
3601 agttttcagc gtgaagaaga aaatttcgca ggatctaaaa taggggtttt aaaagttaga
3661 gaaaaaggtg gaaaatcttt gaaatctagc atagccgggg gtaaagctct gtgaccccat
3721 tttagggtac tgaaaaatgc ggttttttgc cttggatagg cgttgcggag caactctttc
3781 tgattgagtg ggggcaacga aatattatat gttgaaactt ttcagcgtgg gaaaaaaaat
3841 cttgcaggag ctaaaatggg agcttcaaaa gttgggaagt ttatgagatc tatttaagct
3901 aggggcaaag ttctgtgatt ttatttctgg gctttaaata atgtggcttt tcgtcctgga
3961 gaggtgttgc ggagcaactt tcttcgattg agtgggggca acgaaatatt atacgttgaa
4021 acttttcagc gtgggaaaaa aaatctcgca ggagctaaaa taggagcttt aaaagttggg
4081 aagttattag aatctgctta agccaggggt aaagttctgt gactttattt ctgggcttta
4141 aataatgtgg cttttcgccc tggaggggta tttcggagca gctttcttcg attgagtggg
4201 ggcaacgaaa tattatatgt tgaaactttt cagcgtggga aaaaaaatct cgcaggagct
4261 aaaatgggag cttcaaaagt tgggaagttt atgagatcta tttgagctag gggcaaagtt
4321 ctgtgatttt atttctgggc tttgaataat gtggtttttc gtcctggaga ggtgttgcgg
4381 agcaactttc ttcgattgag tgggggcaac gaaatattat atgttgaaac ttttcagcgt
4441 gggaaaaaaa atctcgcagg agctaaaata ggagcttcaa aattttaggg gccgattctg
4501 gtcacgcttt aaagtaaggt cggttaagga tgtaaaaagc catcgggttc atgccccgac
4561 atacgggcat ggtgccccct tacttttata cacttggtcc tgatgttatg ttagcgtggt
4621 accccatgat gacacaatgt aggagatgtc cgtgatgtgg tatgattttt aaaaggctag
4681 gagttgaagc tcattcgaga tgggtctaag cgtgtttcta taaggaacct gcaaggatga
4741 attgggagag catcaaattt tttgaagacg ctggtttaga atcacaactc aagtgcgttg
4801 ttttgtgaca atgagtggaa gctcaattcg gtggtggtat gttagggagt agcgaaagaa
4861 ggtgccagca gctgcggtta ttccagaaat agagctcccg ttaacagaga ggcggctaaa
4921 aagatggtta ggaagtgata aataggggct tacaaaggtc gtaaggaggg gtgaaatcca
4981 tagacttatc gaaggaggct cggagaggcc tgatttctga tgccatgaag tttagagaat
5041 aaacggggat ttggtacccc cttatttcta aatgttaaat ttgcgttaat ttaatggcgc
5101 tgcctgggga ctacgagcaa ttgcttaaaa ctcaaaggac ttggcggtgc cgagcaccac
5161 tcaggggaac ttgacgctta attcgatgat ccgcgaatta ccttacctct tcttgcccaa
5221 taaagcgggt caggctgttt atccccgtct aaagttttta gtttaagcta acagaaatga
5281 gacacgaaaa cttgtacgtt tctaggacag gccgagatgc accttatgga gaggggttag
5341 ttgagttaca attacttaaa agtagtggaa aagttttgga agtaggcttg gaaagtggac
5401 ctgatagtac agctaaatca tcatgttagc tagaaaggtt ggacctcggt gcgtacaaat
5461 cgcccgtcgc cctcttcgaa agtggaggta agtcgtaaca cggtaggggt agaggaatct
5521 gccccttgaa tagagatagg acgtcaatgt aaaattggct gaagttgttg ccctgatgat
5581 gcgttggagg gtgaattgag cttgcagggt taatgaaggt acccttagta taaatatggt
5641 atagccgttt tccatgcggg tggttcgaga tcaagttcgg agggtacttt ttagggtaaa
5701 cggtaactgg gtagaatagt tatagagttt cgttgggttg tggtctcaaa ggcagccgga
5761 aggcttccag tttaagcgtg ttttttgggt taaaaagtgg tagacacaag aacttgggat
5821 gaatataagg atctgattag aattacataa taattaggat taattgtaga aaataactga
5881 aataactgat agattagtat ggagtaagaa aaagtggagt aagaagtaaa gtactgaata
5941 ggaagaaaaa ttaatgggta gaaagtacag gtgaattctg gtaccttttg cattatggct
6001 acgcaagaga atattaagat tagatttccc gaagcgggct gatttactct agtactagag
6061 attaagaggt catcgttgta ttgctgtctt gagatactag agtggaagtg aaaagttatt
6121 cggagcccgt gatagctggt tggtccaaaa gtgcgtaaga gcgtagctct taggaaattg
6181 cgttaacagt aaaggcaagt taatgttttg gctaagaagt aactctttta gcgataaggt
6241 tgagagagaa aaaaaaagtt taggttaagt atttagctct cgagtggggt ttgtagtgcc
6301 catcttctta aggctttaat aagctatgag ctagtgtatt caagaattaa tagttaaact
6361 ttcaaggggt atggacttaa gtttaaagat gaatatgtta gctgaaagac tgcgtagatg
6421 agtagaatgt tgaaaaaata aggagctcta ggagtaaaat ctagggatat gagcgttaaa
6481 attaagaaaa gtagaatcat cattaagtgg gagaaaggaa ctcggcaaat ttgggtgtcg
6541 cctgttttac aaaaacatcg ccagcagagg tagactgatt gttggtagtg cctgctcaat
6601 gcccaagggg taaatagccg ctgtattatg acggtgctaa ggtagcgaaa ttcctagcct
6661 tttaattgga ggcctgcatg aatggcttga cgagcgccct gctgtctctc ttcccatgaa
6721 cttttaaatt aactttcgcg tgcaaaggcg cgaatggctg agttagacga aaagacccta
6781 tgcatcttta ctgagagaga agaaagttct ttagcttggt ttagctgggg cagctgagga
6841 aaaggcaaaa tttccttaat ataaatcata ctggtgggtt tagatccagg ctctttagcg
6901 ggcttgacaa gtagaaaagt tacgctaggg ataacagcgt tatccttctg tggaggtctt
6961 atctgcagga gggattgcga cctcgatgtt gaattaggga tataccagaa aggcgcagaa
7021 gcttttattg tgggtctgtt cgacccttaa aaccctacat gatttgagtt cagaacggcg
7081 taagccagtt cggtttctat cttctcagtt atttggatat agctctgatt tgtacgaaag
7141 gatcgttggg gcgaaattgt tttcttttta tgaaaaacat ataatggtta gattaaaata
7201 gatggggaat gtcagaaatc tatgtgttgg gtttaagccc taattatgag ggttagaatc
7261 cttcttcctc taaaatggtt ttttatacag tggagatagt aagtgtttat ttgtgtgttt
7321 tcttggctgt tgcttttttc actttgttag agcgaaaagc tttagcaagg tttcatcttc
7381 gtaaggggcc gaacaaggta gggtttggtg gaattcctca gcctttggcg gatgccctca
7441 agttatttac taaggagctt cccattccgc gggtgggttt aagatggttg ttttatgtgt
7501 gcccgggact ggctttattg gtaataatgt tattgtggtg aatgtatcct gttttttatt
7561 gcttgagaac gggtcagata agtgtcttat tttttatttg tgtgtctaga atgaacgctt
7621 atgtactgat gtttgctggg tggtcttcaa attccaagta tgctggttta ggggctgtcc
7681 gagcttttgc tcagagtatt tcttatgagg taaggatatc tctgatttta ttatttgctg
7741 tagttttaca tggaagcttc aatctcttct ctattcagaa gagagggcaa tatatgtggt
7801 acgggctcat ttgatggccg gtaactatta gctggttggt ttcctgtctg gctgaaacta
7861 atcgcacacc ttttgatttt gttgaggccg agtctgagct tgtttctggg tataatgtgg
7921 agtatggggg cgggggattt gctagtttgt ttatcgcgga gtacggaaga atcatgttta
7981 ttagattttt aactgttagt gtgttcttta gaaattattg gccttgcttt catttttggg
8041 ctgggttatt tttatttttt aaggctataa taatctgtta ttgatttatc tgggtacgcg
8101 cttcttttcc acgtttgcgg tatgacatgc taatagagtt aatgtgaaaa aggattcttc
8161 cgggttgttt agccagttga atggctttag tcctgtacag tgttatgtag gagtcactag
8221 aatggttata atcggacgag catggttaaa tttgcgtttg gtttagggcc aaaaggtagg
8281 gggttgttcc ctgtctgata acaaagtgtg gtcatttgtg cgtaggtgtg aaaagtgcac
8341 aatagacttt gaatctaaaa gggagggtca actcctcacg tgcaatatga ggttgattag
8401 ggatttaaca gcctggtgaa gtttgagctg gctaggtttg acttttaggt ttttttgtgt
8461 aattggagcg tgtaataagc agcggcattt actcgctttc ttaatactaa tagaagggtg
8521 ttctatgggc attgctgttt cgattgctgg cttgggggag tgggtaaatt ttggcttttt
8581 catagttttt ctaactttct ctgcttgtga aacaagtgtt gggttatctt ttttagttgg
8641 gctcattcgg gctactcgtt ctgggtacgt gcgaggtcaa agaataatag catgctagct
8701 tctgttgtgg gaagagcctg gttagtagcc ctgaggagca taaaattgat aaaaaaggag
8761 ggtcggtgat ttatggtaag ttgagggcta atgattacag ctcttttagt tttgttagat
8821 gggattccct gaggtgtaaa ttgtataata gagacagagg agatgagggt ggatttagct
8881 tcctgctgat tcattattct aagagcctga ctaagaagca tggttctatt ggttagagtc
8941 cgtggggttc tgcataaagg gggggaaggg ataggctatg ttactacagt attctttctt
9001 actttttttc tgatcttttg ctttgctgcg tccgatatct tttggtttta tgttttttat
9061 gaggcgactt taattcccac aaggatgcta atcttggggt ggggtgatca gcctgagcgg
9121 ttggaggcag ctcgatacat aatttgttac accgttatat gctcagctcc tttgtttttt
9181 gcttttatat ggctaggatg gggagaaggg agctttttca tatggtttgt cggttataaa
9241 agagctctat ctggctggtt gtgaatggct ttgagacttg ggttgctagt gaagcttcct
9301 atttttccgt tgcatgtttg gttgcctaag gcccacgttg aggccccgtt agggggttcc
9361 ctgttgttgg ctggaatttt actaaagata ggaggctatg ggctattccg agtcataagg
9421 gcttttgggt atgttttgga agtttttgga atagtggtag ttagcttttg tctgtgggga
9481 ggagtttata ctagtatagc atgcgtgcga caggtggatg taaaagcgtt aattgcttat
9541 tcctctgttg gtcacatggg ggtagcctgt gcaggaattt ttagaaggac tgaggcagga
9601 tgaaatgcag gtataggctt aatactggtt cacgctttcg tttcttgtgg gctcttcact
9661 ttggctagtt atggatatga ggctgtgaaa agccgtagca ttttcttgat aaaagggctt
9721 tgttgcatct accctaggat agctgctttc tgatttattt tttgcgtgct gaacatgggg
9781 tgtcctcctt ctttagggtt gttaagtgag ataattatta ggggaatcct gactgagggg
9841 ggaggtgttt tggggcttgt tccttttgtt atccttctgt tttttggtgg tgcatacaat
9901 ttatacctgt actcggagac gcaacatggg attcccatgg atggaggata ctctgagaag
9961 tatagggtat ctgattatgc ttgcttaaga ggctttctgt tttgaaggct ggttcttgtt
10021 ttaaaaggaa gggtagtatt agggtgggta ttttaatttg acggtgccgg taaaagattt
10081 tcctcgatta ttgtgggatc gaaaagtggt tttacagctg gtaataaagg gtgttatttg
10141 gtagagctaa tcagttcgtt ggtagtgtgt gtcaaagcag tggtgggtag gagatgggag
10201 ttggaaaaat tagacctaaa aaaaggagaa ggcggtagga actgtgttag tttctcctcc
10261 tctaagtctt acgtaagtat gcctttttta tttgctggta ttttcttgac ttttgtttct
10321 ttcacggttc tttggttaag ctggggccct gaaaaacctt taatggtaat catgggggtt
10381 gattttatgg atttgtgttt tgctggagtg gctttagggg taaggttaag ggtaattaag
10441 gttatttatc taatagctgt taggggaatt gtgatatgca ccaggagatt ttctgagagg
10501 tatataagcg gggacgtgca taaagaccgt atgacagatt tagtgtttgt gtttgtcttg
10561 gcaatgttta ctgttgtatc agccgaaaac gtgttcacta tggtgttagg atgggaaggt
10621 ttgggggtta gttcgtacgg gctaattatt tactaccagg acaaacctgc tttaaatgcc
10681 gggtatctta ctagaatgag gatgcgtgta ggggacttac tttttattat tatggtaggg
10741 gtattggtgg gagttgggga gttcagtttg gtaagaggct tggctagaat aggaaccgtt
10801 ttgtgtgttt gttgtataac taaaagtgct actgtccctt tttgtgcctg acttcctgct
10861 gctatgaggg ccccaacccc ggtttctgca cttgtgcatt cctctaccct agtcactgct
10921 ggagtctgct ttttgattga aagttatagg tgcattgagg gcagagttgg tcaagagatt
10981 ctgatttttg ggtctttggt aaccatagct ttagcaggga gtagggcttt gtgggagaat
11041 gacttaaaga aaattgtggc tctttctact atagggcagg ttagtttcat agtttttacc
11101 attgggattg gcatgcctat tttggccttc tttcatatgc ttgttcatgc ttttattaag
11161 gccggtatgt ttattagggt aggtgttctc attcatgcta atataggaga gcaggacctt
11221 cgggagtttg atagaggtat tttgtgtgct catcctctgg ctgttggggg gttagtctct
11281 gggaggctgt cacttatagg tattcccatg ttgtcaggat tttataggaa agaggctatt
11341 gttatggccc taaactcatg tccttataga atttgtttct atactctgtt ctatttgggg
11401 gctgttttaa caactagtta tagatgccga ttagtaatta ggttaggtgt taagtgtaaa
11461 aggaagatag tgagaggggg ggtaccttct gattgtgggt atacagactt tccaattagg
11521 tttttattca ctctctcttt attcgggggg atactatttt gggctgtagc ggtagatgga
11581 tctggttgat tcggcagtat ggtcctaggc ccagagttta tttttaaggt tataatagtt
11641 gccgtgttgt tcggaatctt tacctgtgaa gctgaggagg cgggcgtttg aaggtctaat
11701 cttataagct gaaattcaga gaaagtcgga tttttttata ggatgtggta ttttggtggt
11761 gtaagtggac agccttttgt tgagggattt aagaaatgtt ctgattggat agtccctggt
11821 atggagtact ggagagagca agttgcagct aaagggcttt gagacttggg atcagcatac
11881 tttaggggcg ttcatcgccc aattcagact aatgaggtct ttatcccatg gttttttctt
11941 actggggcta tctttgtttg ttgtttagtc ggatttttaa taggttaagc ctaatagaag
12001 gttggtttat gcacggggaa atactcacaa taatgagtaa aggacttcta atcctctggt
12061 gtgcggggtg gaccgtgctt tcccttaagt taaggaaatt aaaatgatag ctcgacacgt
12121 agtttacttg gttttagcat ttatgattgg ggccctgtct ttgtttcaga gaagccccta
12181 catggtgtga gcgaggttcg agttaaactt gttcataatc tcgcctttcc tactaaatcg
12241 agagcagttt gcacatccta ctaaaggggc aatcatttat tttggttgtc aaaggattgc
12301 ttcagtttat atgattggtg gggcaatttt acaggactta gggtgaaggg ggggatcttt
12361 tttctttctt tctgggtttt tttgtaagct aggagtattt cctttttatt cttgggtgcc
12421 tcggactata gtgagtttaa gttggatgag ctgcttagtt ttgatgactg ttcaaaagtt
12481 gtttccaatc ctttgtgtgc cgtctgtgaa tacagacagg ctgttgggtt ggtgatttgc
12541 tgtgagatta gggattagag cccttgtagc cgggagcata atgttctttc aaactaactt
12601 aaaggctggc ttagcctact cctctgtcct gaacatgtct tgagtactct cacttaaact
12661 gaggagggag tcaggaagag ggctcttttc ggttaacact ttagtggctg gatatcttct
12721 cctttatttc ctggttgtac taagtgtagt gagggttttt atgctaactc aggtgcagac
12781 tttggctgac gttgcgctat ttcagtgagg tcggtttcgg tgggtaaggt acttaggaat
12841 tttatccctt agaggtgtgc ctggcttaat aggatttttg ccaaaggcta tagtggtcat
12901 ggtcgttgta agttttagcc ctattctgat tgcagctctt ctcttgtcat ctgcttttag
12961 tattctttgg tacactaccc cagttgctat agctggggta agacagccgg cttattctga
13021 ggcagatata agtaaaggag ctcgtttaag ttgttacata tcttcatgat taaatttgtc
13081 aggtatcccc ttcttattcc ttctttactt tttttgtttt ttttagagaa cataaggctt
13141 agtaaatgcg ctagggctgg acaaaaagaa gagtgaagat tttacctttg ggtactatct
13201 gatagtaaat gttgggtttg agctagaagc aagttatagg gaaatgtggt aaataggtga
13261 agcacaaaga gggaataggg gggtaacagc tagtgtggtt agatgaacga ttttaatttt
13321 gataatgatg gctacaaatt ttgttcagct tcactgaata ggaaagcagc ctttagttag
13381 ggtagagtta gggacctttt tgaaaaaaag cctgtcacgg gtaattttgc aagatgtctg
13441 agaaatagga ggatggctgt aaaccatttt aggtcggaag ttaccgtctc ttgtaattag
13501 aataaattaa ataaacgggc caatgtagca taataggtcg aatgcattgc ttttgtaaag
13561 caaaggaagg gtgtgtataa acccctttgg ttagtgactg agttttttaa aaatagaggt
13621 tgagtttacc ggtgggtctg caggaccaac cataaggata ttggaacttt atatcttttg
13681 ttaggactat gatccgggat agtaggtact ggatttaggg taattatccg tactgaattg
13741 tgtcgtcctg gggcagggtt tttgggggat gggcagctct ataatagaat tgtaactgct
13801 catgctttta tcataatttt cttttttgtt atacctataa tgattggggg gtttggaaac
13861 tggctaatcc ctttgatgat aggggtgcca gatatggctt ttcctcgatt gaataatctg
13921 agattttggc tattgccttc ttcgctatac tgtttgttct tatcagcttt tgtagagggc
13981 ggtgccggga ctggctgaac tatctatcct cctctttcta cttatctgta ccatggaatg
14041 gctgtcgatt tagctatttt ttctcttcat ctggctggat tagcttctat ttttggcgga
14101 attaatttta ttgttacagc tcagaatata cgtcgaatgg agagacattt aatggatttg
14161 ttcccttggg ctgttctagt aactgctgtg ctgttggtag tctctcttcc tgtgttggcg
14221 ggtggaatta ctatgctttt aactgatcga cactttaaca ctaggtttta ctttcctgga
14281 ggagggggag accctgtttt gtttcagcac cttttctggt tctttggtca tccggaagtc
14341 tatattctta ttcttccggc ttttgggatg atttcgcata tagtgtgtca ttgatcgttt
14401 aagctagagg tatttggggg cttggctata atttatgcta tactaggaat tggggccctt
14461 ggatttttag tttgggggca ccatatgttc acagtcggaa tagatgttaa tagacgggct
14521 tattttaggg ccgccaccct gattattgct gttccaactg gagttaaggt gtttaggtga
14581 atcgccacaa tgtccggatg ccggctgaag actagggctc ctgttctttg aagagttgga
14641 tttttaggct tatttacatt tggcgggctg actggtgtaa ttttggctag ggcttctgta
14701 gatattgttt tgcacgatac atactttgta actgggcact ttcattatgt tttaagaata
14761 ggtgccgtat ttgctttgtt tggggctttt aaccactgat ttccgttatt tactggcttg
14821 tctcttcatc gccgtttggc aaagtcccag tttattggta tgttcatcgg ggttaaccta
14881 actttctttc ctcatcattt tctgggtttg agggggatgc ctcgccgaat catcgactac
14941 cctgactgct tcgcgaagtg gaatagggtc tctaggtggg gttccatgct ttctttcgtt
15001 ggtttaatgt gattttcttt cattctatga gaagctttta tcgcacagcg accgttgctc
15061 ttcataaaca acgtttcagt gtttttagag tgaatggggg gggctaagct tcctccagct
15121 tcccacggat gattgttaga agcacctagg ctttgaagaa agcgggctcg ttaagagtaa
15181 ggtagctagg gggtagcaag cgtgttacaa aataataggt tttgtgaggt tgattccagc
15241 ttgggatggt ggggtatact ttaaaagtca aaagtgggag aagacttcct cgtgtgccat
15301 gacacttagt agatccaagt ccatgaccct ttacgacttc tgtaagtctg ttatgcgtgg
15361 ttcttggtct aactaggtga atgaatggtc gagattgaag aattattatt tatggggctg
15421 tgctgctgag aatttcagta gtgaggtggt ttcgagacat cgtaattgag gcaactttcc
15481 agggaatgca cactaagcct gtgcaaaatg gattaaagct agggtttaag ctttttttac
15541 tgtctgagct tatgcttttt ttttcttttt tttgggcctt catacatagg gcactatccc
15601 cttcagtaga ggtcggttgc tgctgacctc cagcagggct aaccacgtta aatccttggc
15661 aggatgcagc cgtaaacact tgcattcttt tgacctctgg agctagcgta acgtgaaggc
15721 ataaggctat aaaggctggt atcataaggg agagttacat ggggctgtta cagactattg
15781 gttggggttg tctattcaca tatagccagt accaggagta tagggtttgc cctttcacta
15841 ttgctgatag ggtgtacggc tcctgttttt tcatgttgac tgggttacac ggattgcatg
15901 taattggagg gacgagattt ttaattgcta gcctgtttcg aataggtcgt cgtcactttt
15961 ctactggaca ccatttaggc tatgtgtttg ccatttggta ctgacatttc gtcgacatca
16021 tatggttgtt tgtctgagga attgtatata tttgaggttc ttggatataa ggcgcgataa
16081 gcttcaaaat taattggaaa tgtagctaga tggttaggga ttgtggcgga tacctagatt
16141 taggggcctc gatttgaaat cgagacaggt ggaagattct gcattcgctt ggaaactact
16201 agggagtatt ggtgctgtac tttaacgtaa aaggcttgac ttgcattcag gtaatagatt
16261 agtttatatc tcggtgcctt tgttaggggc ctaagctaac ctagctatgg gcttattaaa
16321 gcccaaggtg cttgttatct ggcactgagg ctctattggt ataatgtggt tgtttgctct
16381 agaaactaga cgcacctaag gtttttgaat ataaggcgtg gtgagtttta aaacaattgg
16441 aaaaatagct agatgggttg ggattgtggt aaacctctga atttagaagg ccccaatttt
16501 aaagcgagac aggggaggct ctacattcgc ttggaaatta tcaggggaca ttggtgtcgt
16561 actttaacgt aaaaggccca gcgcaaatgg gaaatagatt agtttctatc tcggcaccta
16621 ttttagggct ttatggtaaa cctctgaatt tagaaggccc caattttaaa gcgagacagg
16681 ggaggctcta cattcgcttg gaaattatca ggggacattg gtgccgtact ttaacgcaaa
16741 aggcccagcg caaatgggaa atagattagt ttatatctcg gcacctattt tagggtttta
16801 tggtaaacct ctgaatttag aaggccccaa ttttaaagcg agacagggga ggctctacat
16861 tcgcttggaa attatcaggg gacattggtg ccgtacttta acgtaaaagg cccagcgcaa
16921 atgggaaata gattagttta tatctcggta cctatttcag ggctttaagt taatcagact
16981 atgggccttc aaagcctaag gtgttcataa tttgggcaag ctctgagatc atgattgctg
17041 ggagattaat aagtattttt tatgaaggaa ggggttgatg gcctgagacc cacatactgt
17101 tgttcttttt acccgggttc attctttgca cggagtaccg gggattagtc gctagaacat
17161 gtggggtagc tgggggttta atgtttcctt tagggaaaaa gcttttcgat gagaaagttg
17221 gagggatatt tttgttccct agattattta tggcttcatt tctaatggtc ctatttaatt
17281 gcttgatggg aaccgtccct tgaaggtacc cagtaatagc ccattggaga gtgacatgca
17341 ctgtgacttt tcccttgtgg ttggggctat acgtgaggtg tctgcgttcg gggccagtag
17401 ggttctttgc cagattggtg ccaaaaggag tgcctgaatt atttgggttt tttatttttc
17461 cgatcgaaat tgtgaggatt ttatgtcaaa ttgtaagact aagggttcga atgatgttaa
17521 acatggcttt tgggtttata attattcatg ttgtgataag aatcttgagc tctattgtgc
17581 tgggaagggg ggcatccgtt ggtggagtta taatagtttt ggtggcaagg ggggtgttgg
17641 ttgctgagtt ctttgtatgt atgattcaaa gagggctgct gtttgggctt ctgtgtatat
17701 atagggcgaa tcatcctgga agaatgggtt atgcgtcgtg ctattgttcc gttacggaaa
17761 agtaattcaa ttttaaaagc agtaaatggt gcggtttggg aacttccttg tgcacctaac
17821 ttaaatatat ggtgaaattt tgggtcatgc ttggggattt tacttgctac tcagattgtt
17881 tctggtatac ttttggccat tcattacaca gcttatgagt caatctcttt tgagagggtg
17941 aagtttatta tgcgagatgt taactacggc tggttaattc gagggatcca ttctaatgga
18001 gcctctgtgt tctttgtttg cctctatctt catattggtc ggggcctata ttatgcgtct
18061 tacaggtctt tgctagctgt ttgaaatgtg ggagtggtgt tgtatttaat gtcgatggct
18121 atcgcttttt tagggtatgt acttccttgg ggtaccatgt ccttttgagg cgctacggta
18181 attactaatc tattcaccgt agttccttac gttggaaata ctcttgtgta ttgaatgtga
18241 gggggctata gggttagcgg ccctacttta aaacgttttt ttgttcttca cttcttctta
18301 cctctggcca tggtagtcgt ggtgatgtta catcttttgt acttacatga aggtggctca
18361 aataaccctc taggtatcag tagagatgtg ttggccgttc ggtttcaccc tttctacacc
18421 tctaaggatt tagtagggtt ggctattgtt tacggtgctt ttgggttttt ggcccttgga
18481 tttccagatc tcttaaggaa ttatctaaat aatgttccgg tggatgctct ccgaactcct
18541 cggcatattg aacctgaatg atattttttg tatgcgtatg ctattttgcg ctctgttcct
18601 cataagacgg tagggattat tgctatgctt atggctatct tagtcatggt agtgctacca
18661 tatattgact cttctaagtg tcgggggctg gagtattacc ccctaaggca gttcttgttt
18721 tggacgttcg tagcaaattg ggctttactg ggctgaattg ggagaatgcc gccaaaagga
18781 gtctgttatg attatggtca atgatttacc gtcttccact tagggtactt tgggctccta
18841 gttgttttta acataatgtg ggataaatga ctattcatgg aggaggggga gttataagag
18901 tgaagggaaa agtgta
//
