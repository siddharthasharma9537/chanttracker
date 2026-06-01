'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown } from 'lucide-react'

interface Mantra {
  id: string
  name: string
  name_devanagari: string
  name_te?: string
  category: string
  color?: string
  adhidevata_te?: string
  adhidevata_devanagari?: string
  adhidevata_mantra_te?: string
  adhidevata_mantra_devanagari?: string
  pratyadhidevata_te?: string
  pratyadhidevata_devanagari?: string
  pratyadhidevata_mantra_te?: string
  pratyadhidevata_mantra_devanagari?: string
  mantra_te?: string
  mantra_devanagari?: string
}

interface MantrasDropdownProps {
  onSelect: (mantraId: string, mantra: Mantra) => void
  isLoading?: boolean
}

// Demo mantras for dev/testing - includes 9 Navagrahas with full deity mantra texts
const DEMO_MANTRAS: Mantra[] = [
  {
    id: 'sun-1',
    name: 'Surya Mantra',
    name_devanagari: 'सूर्य मंत्र',
    category: 'custom',
    color: '#F59E0B',
  },
  {
    id: 'moon-1',
    name: 'Chandra Mantra',
    name_devanagari: 'चंद्र मंत्र',
    category: 'custom',
    color: '#60A5FA',
  },
  {
    id: 'gayatri-1',
    name: 'Gayatri Mantra',
    name_devanagari: 'गायत्री मंत्र',
    category: 'devata',
    color: '#EC4899',
  },
  {
    id: 'om-1',
    name: 'Om Chanting',
    name_devanagari: 'ॐ',
    category: 'beeja',
    color: '#8B5CF6',
  },
  // Navagraha Mantras with full deity mantra texts
  {
    id: 'navagraha_surya',
    name: 'Surya',
    name_te: 'సూర్య',
    name_devanagari: 'सूर्य',
    adhidevata_te: 'సూర్య',
    adhidevata_devanagari: 'सूर्य',
    adhidevata_mantra_te: 'అ॒గ్నిందూ॒తం వృఀ ॑ణీమహే॒ హోతా॑రం-విఀ॒శ్వావే॑దసమ్ । అ॒స్య య॒జ్ఞస్య॑ సు॒క్రతుం᳚ ॥',
    adhidevata_mantra_devanagari: 'अ॒ग्निंदू॒तं वृऀ ॑णीमहे॒ होता॑रं-विऀ॒श्वावे॑दसम् । अ॒स्य य॒ज्ञस्य॑ सु॒क्रतुं᳚ ॥',
    pratyadhidevata_te: 'ఇంద్ర',
    pratyadhidevata_devanagari: 'इंद्र',
    pratyadhidevata_mantra_te: 'యేషా॒మీశే॑ పశు॒పతిः॑ పశూ॒నాం చతు॑ష్పదాము॒త చ॑ ద్వి॒పదా᳚మ్ । నిష్క్రీ॑తో॒ఽయం-యఀ॒జ్ఞియం॑ భా॒గమే॑తు రా॒యస్పోషా॒ యజ॑మానస్య సంతు ॥',
    pratyadhidevata_mantra_devanagari: 'येषा॒mीशे॑ पशु॒पतिः॑ पशू॒नां चतु॑ष्पदामु॒त च॑ द्वि॒पदा᳚म् । निष्क्री॑तो॒ऽयं-यऀ॒ज्ञियं॑ भा॒गमे॑तु रा॒यस्पोषा॒ यज॑मानस्य संतु ॥',
    mantra_te: 'ఓం ఆస॒త్యేన॒ రజ॑సా॒ వర్త॑మానో నివే॒శయ॑న్న॒మృతం॒ మర్త్యం॑చ । హి॒ర॒ణ్యయే॑న సవి॒తా రథే॒నాఽఽదే॒వో యా॑తి॒భువ॑నా వి॒పశ్యన్॑ ॥',
    mantra_devanagari: 'ॐ आस॒त्येन॒ रज॑सा॒ वर्त॑मानो निवे॒शय॑न्न॒मृतं॒ मर्त्यं॑च । हि॒र॒ण्यये॑न सवि॒ता रथे॒नाऽऽदे॒वो या॑ति॒भुव॑ना वि॒पश्यन्॑ ॥',
    category: 'navagraha',
    color: '#FFD700',
  },
  {
    id: 'navagraha_chandra',
    name: 'Chandra',
    name_te: 'చంద్ర',
    name_devanagari: 'चंद्र',
    adhidevata_te: 'సోమ',
    adhidevata_devanagari: 'सोम',
    adhidevata_mantra_te: 'అ॒ప్సుమే॒ సోమో॑ అబ్రవీదం॒తర్విశ్వా॑ని భేష॒జా । అ॒గ్నిఞ్చ॑ వి॒శ్వశం॑భువం॒మాప॑శ్చ వి॒శ్వభే॑షజీః ॥',
    adhidevata_mantra_devanagari: 'अ॒प्सुमे॒ सोमो॑ अब्रवीदं॒तर्विश्वा॑नि भेष॒जा । अ॒ग्निञ्च॑ वि॒श्वशं॑भुवं॒माप॑श्च वि॒श्वभे॑षजीः ॥',
    pratyadhidevata_te: 'గౌరీ',
    pratyadhidevata_devanagari: 'गौरी',
    pratyadhidevata_mantra_te: 'గౌ॒రీం మి॑మాయ సలి॒లాని॒ తక్ష॒త్యేక॑పదీ ద్వి॒పదీ॒ సా చతు॑ష్పదీ । అ॒ష్టాప॑దీ॒ నవ॑పదీ బభూ॒వుషీ॑ స॒హస్రా॑క్షరా పర॒మే వ్యో॑మన్న్ ॥',
    pratyadhidevata_mantra_devanagari: 'गौ॒रीं मि॑माय सलि॒लानि॒ तक्ष॒त्येक॑पदी द्वि॒पदी॒ सा चतु॑ष्पदी । अ॒ष्टाप॑दी॒ नव॑पदी बभू॒वुषी॑ स॒हस्रा॑क्षरा परम॒े व्यो॑मन्न् ॥',
    mantra_te: 'ఓం ఆప్యా॑యస్వ॒ సమే॑తు తే వి॒శ్వత॑స్సోమ॒ వృష్ణి॑యమ్ । భవా॒ వాజ॑స్య సంగ॒థే ॥',
    mantra_devanagari: 'ॐ आप्या॑यस्व॒ समे॑तु ते वि॒श्वत॑स्सोम॒ वृष्णि॑यम् । भवा॒ वाज॑स्य संग॒थे ॥',
    category: 'navagraha',
    color: '#E0E0E0',
  },
  {
    id: 'navagraha_mangal',
    name: 'Mangal',
    name_te: 'మంగళ',
    name_devanagari: 'मंगल',
    adhidevata_te: 'అగ్ని',
    adhidevata_devanagari: 'अग्नि',
    adhidevata_mantra_te: 'స్యో॒నా పృ॑థివి॒ భవా॑ఽనృక్ష॒రా ని॒వేశ॑నీ । యచ్ఛా॑న॒శ్శర్మ॑ స॒ప్రథాः᳚ ॥',
    adhidevata_mantra_devanagari: 'स्यो॒ना पृ॑थिवि॒ भवा॑ऽनृक्ष॒रा नि॒वेश॑नी । यच्छा॑न॒श्शर्म॑ स॒प्रथाः᳚ ॥',
    pratyadhidevata_te: 'క్షేత్ర',
    pratyadhidevata_devanagari: 'क्षेत्र',
    pratyadhidevata_mantra_te: 'క్ష్ం त्रस్య॒ పతి॑నా వ॒యగ్ంహి॒తే నే॑వ జయామసి । గామశ్వం॑ పోషయి॒త్.ంవా స నో॑ మృడాతీ॒దృశే᳚ ॥',
    pratyadhidevata_mantra_devanagari: 'क्ष्ं त्रस्य॒ पति॑ना व॒यग्ंहि॒ते ने॑व जयामसि । गामश्वं॑ पोषयि॒त्.ंवा स नो॑ मृडाती॒दृशे᳚ ॥',
    mantra_te: 'ఓం అ॒గ్నిర్మూ॒ర్ధా ది॒వఃక॒కుత్పతిः॑ పృథి॒వ్యా అ॒యమ్ । అ॒పాగ్ంరేతాగ్ం॑సి జిన్వతి ॥',
    mantra_devanagari: 'ॐ अ॒ग्निर्मू॒र्धा दि॒वः क॒कुत्पतिः॑ पृथि॒व्या अ॒यम् । अ॒पाग्ंरेताग्ं॑सि जिन्वति ॥',
    category: 'navagraha',
    color: '#DC2626',
  },
  {
    id: 'navagraha_budha',
    name: 'Budha',
    name_te: 'బుధ',
    name_devanagari: 'बुध',
    adhidevata_te: 'విష్ణు',
    adhidevata_devanagari: 'विष्णु',
    adhidevata_mantra_te: 'ఇ॒దం-విఀష్ణు॒ర్విచ॑క్రమే త్రే॒ధా నిద॑ధే ప॒దమ్ । సమూ॑ఢమస్యపాగ్ం సు॒రే ॥',
    adhidevata_mantra_devanagari: 'इ॒दं-विऀष्णु॒र्विच॑क्रमे त्रे॒धा निद॑धे प॒दम् । समू॑ढमस्यपाग्ं सु॒रे ॥',
    pratyadhidevata_te: 'విష్ణు',
    pratyadhidevata_devanagari: 'विष्णु',
    pratyadhidevata_mantra_te: 'విష్ణో॑ ర॒రాట॑మసి॒ విష్ణోః᳚ పృ॒ష్ఠమ॑సి॒ విష్ణో॒శ్శ్నప్త్రే᳚స్థో॒ విష్ణో॒స్స్యూర॑సి॒ విష్ణో᳚ర్ధ్రు॒వమ॑సి వైష్ణ॒వమ॑సి॒ విష్ణ॑వే త్వా ॥',
    pratyadhidevata_mantra_devanagari: 'विष्णो॑ र॒राट॑मसि॒ विष्णोः᳚ पृ॒ष्ठम॑सि॒ विष्णो॒श्श्नप्त्रे॑स्थो॒ विष्णो॒स्स्यूर॑सि॒ विष्णो᳚र्ध्रु॒वम॑सि वैष्ण॒वम॑सि॒ विष्ण॑वे त्वा ॥',
    mantra_te: 'ఓం ఉద్బు॑ధ్యస్వాగ్నే॒ ప్రతి॑జాగృహ్యేనమిష్టాపూ॒ర్తే సగ్ంసృ॑జేథామయంచ॑ । పునః॑ కృ॒ణ్వగ్గ్‍స్త్వా॑ పి॒తరం॒-యుఀవా॑నమ॒న్వాతాగ్ం॑సీ॒త్త్వయి॒ తంతు॑మే॒తమ్ ॥',
    mantra_devanagari: 'ॐ उद्बु॑ध्यस्वाग्ने॒ प्रति॑जागृह्येनमिष्टापू॒र्ते सग्ंसृ॑जेथामयंच॑ । पुनः॑ कृ॒ण्वग्ग्‍स्त्वा॑ पि॒तरं॒-युऀवा॑नम॒न्वाताग्ं॑सी॒त्त्वयि॒ तंतु॑मे॒तम् ॥',
    category: 'navagraha',
    color: '#10B981',
  },
  {
    id: 'navagraha_brihaspati',
    name: 'Brihaspati',
    name_te: 'బృహస్పతి',
    name_devanagari: 'बृहस्पति',
    adhidevata_te: 'ఇంద్ర',
    adhidevata_devanagari: 'इंद्र',
    adhidevata_mantra_te: 'ఇంద్ర॑మరుత్వ ఇ॒హ పా॑హి॒ సోమం॒-యఀథా॑ శార్యా॒తే అపి॑బస్సు॒తస్య॑ । తవ॒ ప్రణీ॑తీ॒ తవ॑ శూర॒శర్మ॒న్నావి॑వాసంతి క॒వయ॑స్సుయ॒జ్ఞాః ॥',
    adhidevata_mantra_devanagari: 'इंद्र॑मरुत्व इ॒ह पा॑हि॒ सोमं॒-yऀथा॑ शार्या॒ते अपि॑बस्सु॒तस्य॑ । तव॒ प्रणी॑ती॒ तव॑ शूर॒शर्म॒न्नावि॑वासंति क॒वय॑स्सुय॒ज्ञाः ॥',
    pratyadhidevata_te: 'బ్రహ్మ',
    pratyadhidevata_devanagari: 'ब्रह्म',
    pratyadhidevata_mantra_te: 'బ్రహ్మ॑జజ్ఞా॒నం ప్ర॑థ॒మం పు॒రస్తా॒द్విసీ॑మ॒తస్సు॒రుచో॑ వే॒న ఆ॑వః । సబు॒ధ్నియా॑ ఉప॒మా అ॑స్య వి॒ష్ఠాస్స॒తశ్చ॒ యోని॒మస॑తశ్చ॒ వివః॑ ॥',
    pratyadhidevata_mantra_devanagari: 'ब्रह्म॑जज्ञा॒नं प्र॑थ॒मं पु॒रस्ता॒द्विसी॑म॒तस्सु॒रुचो॑ वे॒न आ॑वः । सबु॒ध्निया॑ उप॒मा अ॑स्य वि॒ष्ठास्स॒तश्च॒ योनि॒मस॑तश्च॒ ववः॑ ॥',
    mantra_te: 'ఓం బృహ॑స్పతే॒ అతి॒యద॒ర్యో అర్​హా᳚ద్ద్యు॒మద్వి॒భాతి॒ క్రతు॑మ॒జ్జనే॑షు ।యద్దీ॒దయ॒చ్చవ॑సర్తప్రజాత॒ తద॒స్మాసు॒ ద్రవి॑ణంధేహి చి॒త్రమ్ ॥',
    mantra_devanagari: 'ॐ बृह॑स्पते॒ अति॒यद॒र्यो अर्​हाॳ द्द्यु॒मद्वि॒भाति॒ क्रतु॑म॒ज्जने॑षु ।यद्दी॒दय॒च्छव॑सर्तप्रजात॒ तद॒स्मासु॒ द्रवि॑णंधेही चि॒त्रम् ॥',
    category: 'navagraha',
    color: '#FCD34D',
  },
  {
    id: 'navagraha_shukra',
    name: 'Shukra',
    name_te: 'శుక్ర',
    name_devanagari: 'शुक्र',
    adhidevata_te: 'ఇంద్రాణీ',
    adhidevata_devanagari: 'इंद्राणी',
    adhidevata_mantra_te: 'ఇం॒ద్రా॒ణీమా॒సు నారి॑షు సు॒పత్.ంఈ॑మ॒హమ॑శ్రవమ్ । న హ్య॑స్యా అప॒రంచ॒న జ॒రసా॒ మర॑తే॒ పతిః॑ ॥',
    adhidevata_mantra_devanagari: 'इं॒द्रा॒णीमा॒सु नारि॑षु सु॒पत्.ंई॑म॒हम॑श्रवम् । न ह्य॑स्या अप॒रंच॒न ज॒रसा॒ मर॑ते॒ पतिः॑ ॥',
    pratyadhidevata_te: 'ఇంద్ర',
    pratyadhidevata_devanagari: 'इंद्र',
    pratyadhidevata_mantra_te: 'ఇంద్రం॑-వోఀ వి॒శ్వత॒స్పరి॒ హవా॑మహే॒ జనే᳚భ్యః । అ॒స్మాక॑మస్తు॒ కేవ॑లः॥',
    pratyadhidevata_mantra_devanagari: 'इंद्रं॑-वोऀ वि॒श्वत॒स्परि॒ हवा॑महे॒ जने᳚भ्यः । अ॒स्माक॑मस्तु॒ केव॑लः॥',
    mantra_te: 'ఓం ప్రవ॑శ్శు॒క్రాయ॑ భా॒నవే॑ భరధ్వమ్ । హ॒వ్యం మ॒తిం చా॒గ్నయే॒ సుపూ॑తమ్ । యో దైవ్యా॑నిమాను॑షా జ॒నూగ్ంషి॑ అం॒తర్విశ్వా॑ని వి॒ద్మ నా॒ జిగా॑తి ॥',
    mantra_devanagari: 'ॐ प्रव॑श्शु॒क्राय॑ भा॒नवे॑ भरध्वम् । ह॒व्यं म॒तिं चा॒ग्नये॒ सुपू॑तम् । यो दैव्या॑निमानु॑षा ज॒नूग्ंषि॑ अं॒तर्विश्वा॑नि वि॒द्म ना॒ जिगा॑ति ॥',
    category: 'navagraha',
    color: '#F3F4F6',
  },
  {
    id: 'navagraha_shani',
    name: 'Shani',
    name_te: 'శని',
    name_devanagari: 'शनि',
    adhidevata_te: 'ప్రజాపతి',
    adhidevata_devanagari: 'प्रजापति',
    adhidevata_mantra_te: 'ప్రజా॑పతే॒ న త్వదే॒తాన్య॒న్యో విశ్వా॑ జా॒తాని॒ పరి॒తా బ॑భూవ । యత్కా॑మాస్తే జుహు॒మస్తన్నో॑ అస్తు వ॒యగ్గ్‍స్యా॑म॒ పత॑యో రయీ॒ణామ్ ॥',
    adhidevata_mantra_devanagari: 'प्रजा॑पते॒ न त्वदे॒तान्य॒न्यो विश्वा॑ जा॒तानि॒ परि॒ता ब॑भूव । यत्का॑मास्ते जुहु॒मस्तन्नो॑ अस्तु व॒यग्ग्‍स्या॑म॒ पत॑यो रयी॒णाम् ॥',
    pratyadhidevata_te: 'ఆంగిర',
    pratyadhidevata_devanagari: 'आंगिर',
    pratyadhidevata_mantra_te: 'ఇ॒మం-యఀ ॑మప్రస్త॒రమాహి సీదాఽంగి॑రోభిః పి॒తృభి॑స్సం​విఀదా॒నః । ఆత్వా॒ మంత్రాः᳚ కవిశ॒స్తా వ॑హంత్వే॒నా రా॑జన్\, హ॒విషా॑ మాదయస్వ ॥',
    pratyadhidevata_mantra_devanagari: 'इ॒मं-यऀ ॑मप्रस्त॒रमाही सीदाऽंगि॑रोभिः पि॒तृभि॑स्सं​विऀदा॒नः । आत्वा॒ मंत्राः᳚ कविश॒स्ता व॑हंत्वे॒ना रा॑जन्\, ह॒विषा॑ मादयस्व ॥',
    mantra_te: 'ఓం శన్నో॑ దే॒వీర॒భిష్ట॑య॒ ఆపో॑ భవంతు పీ॒తయే᳚ । శం​యోఀర॒భిస్ర॑వంతు నః ॥',
    mantra_devanagari: 'ॐ शन्नो॑ दे॒वीर॒भिष्ट॑य॒ आपो॑ भवंतु पी॒तयेॳ । शं​योऀर॒भिस्र॑वंतु नः ॥',
    category: 'navagraha',
    color: '#1F2937',
  },
  {
    id: 'navagraha_rahu',
    name: 'Rahu',
    name_te: 'రాహు',
    name_devanagari: 'राहु',
    adhidevata_te: 'వ్యోమ',
    adhidevata_devanagari: 'व्योम',
    adhidevata_mantra_te: 'ఆఽయంగౌః పృశ్నిర॑క్రమీ॒దస॑నన్మా॒తరం॒ పునః॑ । పి॒తరం॑చ ప్ర॒యంత్సువః॑ ॥',
    adhidevata_mantra_devanagari: 'आऽयंगौः पृश्निर॑क्रमी॒दस॑नन्मा॒तरं॒ पुनः॑ । पि॒तरं॑च प्र॒यंत्सुवः॑ ॥',
    pratyadhidevata_te: 'దేవీ',
    pratyadhidevata_devanagari: 'देवी',
    pratyadhidevata_mantra_te: 'యత్తే॑ దే॒వీ నిర్‍ఋ॑తిరాబ॒బంధ॒ దామ॑ గ్రీ॒వాస్వ॑విచ॒ర్త్యమ్ । ఇ॒దంతే॒ తద్విష్యా॒మ్యాయు॑షో॒ న మధ్యా॒దథా॑జీ॒వః పి॒తుమ॑ద్ధి॒ ప్రము॑క్తః ॥',
    pratyadhidevata_mantra_devanagari: 'यत्ते॑ दे॒वी निर्‍ऋ॑तिराब॒बंध॒ दाम॑ ग्री॒वास्व॑विच॒र्त्यम् । इ॒दंते॒ तद्विष्या॒म्याय॑षो॒ न मध्या॒दथा॑जी॒वः पि॒तुम॑द्धि॒ प्रमु॑क्तः ॥',
    mantra_te: 'ఓం కయా॑ నశ్చి॒త్ర ఆభు॑వదూ॒తీ స॒దావృ॑ధ॒స్సఖా᳚ । కయా॒ శచి॑ష్ఠయా వృ॒తా ॥',
    mantra_devanagari: 'ॐ कया॑ नश्चि॒त्र आभु॑वदू॒ती स॒दावृ॑ध॒स्सखाॳ । कया॒ शचि॑ष्ठया वृ॒ता ॥',
    category: 'navagraha',
    color: '#6B7280',
  },
  {
    id: 'navagraha_ketu',
    name: 'Ketu',
    name_te: 'కేతు',
    name_devanagari: 'केतु',
    adhidevata_te: 'బ్రహ్మ',
    adhidevata_devanagari: 'ब्रह्म',
    adhidevata_mantra_te: 'బ్ర॒హ్మా దే॒వానాం᳚ పద॒వీః క॑వీ॒నామృషి॒ర్విప్రా॑ణాం మహి॒షో మృ॒గాణా᳚మ్ । శ్యే॒నోగృధ్రా॑ణా॒గ్॒స్వధి॑తి॒ర్వనా॑నా॒గ్ం॒ సోమః॑ ప॒విత్ర॒మత్యే॑తి॒ రేభన్ ॥',
    adhidevata_mantra_devanagari: 'ब्र॒ह्मा दे॒वानां᳚ पद॒वीः क॑वी॒नामृषि॒र्विप्रा॑णां महि॒षो मृ॒गाणा᳚म् । श्ये॒नोगृध्रा॑णा॒ग्॒स्वधि॑ति॒र्वना॑ना॒ग्ं॒ सोमः॑ प॒वित्र॒मत्ये॑ति॒ रेभन् ॥',
    pratyadhidevata_te: 'చంద్ర',
    pratyadhidevata_devanagari: 'चंद्र',
    pratyadhidevata_mantra_te: 'సచి॑త్ర చి॒త్రం చి॒తయన్᳚తమ॒స్మే చిత్ర॑క్షత్ర చి॒త్రత॑మం-వऀయో॒ధామ్ । చం॒ద్రం ర॒యిం పు॑రు॒వీరం᳚ బృ॒హంతం॒ చంద్ర॑చం॒ద్రాభి॑ర్గృణ॒తే యు॑వస్వ ॥',
    pratyadhidevata_mantra_devanagari: 'सचि॑त्र चि॒त्रं चि॒तयन्᳚तम॒स्मे चित्र॑क्षत्र चि॒त्रत॑मं-वऀयो॒धाम् । चं॒द्रं र॒यिं पु॑रु॒वीरं᳚ बृ॒हंतं॒ चंद्र॑चं॒द्राभि॑र्गृण॒ते यु॑वस्व ॥',
    mantra_te: 'ఓం కే॒తుంకృ॒ణ్వన్న॑కే॒తవే॒ పేశో॑ మర్యా అపే॒శసే᳚ । సము॒షద్భి॑రజాయథాः ॥',
    mantra_devanagari: 'ॐ के॒तुंकृ॒ण्वन्न॑के॒तवे॒ पेशो॑ मर्या अपे॒शसेॳ । समु॒षद्भि॑रजायथाः ॥',
    category: 'navagraha',
    color: '#FB923C',
  },
]

export function MantrasDropdown({ onSelect, isLoading }: MantrasDropdownProps) {
  const [mantras, setMantras] = useState<Mantra[]>(DEMO_MANTRAS)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null)
  const [isLoadingMantras, setIsLoadingMantras] = useState(false)

  useEffect(() => {
    // Try to fetch today's mantras via RPC
    const fetchMantras = async () => {
      const supabase = createClient()
      try {
        setIsLoadingMantras(true)
        const { data, error } = await (supabase.rpc as any)('get_panchang', {
          p_date: new Date().toLocaleDateString('sv'),
        })

        if (error) {
          console.warn('Failed to fetch panchang, using demo mantras:', error)
          setMantras(DEMO_MANTRAS)
        } else if (data && Array.isArray(data) && data.length > 0) {
          // Enrich RPC data with deity fields from DEMO_MANTRAS
          const enrichedMantras = data.map(rpcMantra => {
            const demoMantra = DEMO_MANTRAS.find(m => m.id === rpcMantra.id)
            if (demoMantra) {
              return {
                ...rpcMantra,
                adhidevata_te: rpcMantra.adhidevata_te || demoMantra.adhidevata_te,
                adhidevata_devanagari: rpcMantra.adhidevata_devanagari || demoMantra.adhidevata_devanagari,
                adhidevata_mantra_te: rpcMantra.adhidevata_mantra_te || demoMantra.adhidevata_mantra_te,
                adhidevata_mantra_devanagari: rpcMantra.adhidevata_mantra_devanagari || demoMantra.adhidevata_mantra_devanagari,
                pratyadhidevata_te: rpcMantra.pratyadhidevata_te || demoMantra.pratyadhidevata_te,
                pratyadhidevata_devanagari: rpcMantra.pratyadhidevata_devanagari || demoMantra.pratyadhidevata_devanagari,
                pratyadhidevata_mantra_te: rpcMantra.pratyadhidevata_mantra_te || demoMantra.pratyadhidevata_mantra_te,
                pratyadhidevata_mantra_devanagari: rpcMantra.pratyadhidevata_mantra_devanagari || demoMantra.pratyadhidevata_mantra_devanagari,
                mantra_te: rpcMantra.mantra_te || demoMantra.mantra_te,
                mantra_devanagari: rpcMantra.mantra_devanagari || demoMantra.mantra_devanagari,
              }
            }
            return rpcMantra
          })
          setMantras(enrichedMantras)
        } else {
          setMantras(DEMO_MANTRAS)
        }
      } catch (err) {
        console.warn('Error fetching mantras:', err)
        setMantras(DEMO_MANTRAS)
      } finally {
        setIsLoadingMantras(false)
      }
    }

    fetchMantras()
  }, [])

  const handleSelect = (mantra: Mantra) => {
    setSelectedMantra(mantra)
    setIsOpen(false)
    onSelect(mantra.id, mantra)
  }

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading || isLoadingMantras}
          className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/8 hover:bg-white/12 disabled:bg-white/5 border border-white/20 hover:border-white/30 disabled:border-white/15 rounded-xl font-semibold text-white transition shadow-md hover:shadow-lg disabled:shadow-none"
        >
          <div className="text-left">
            {selectedMantra ? (
              <>
                <p className="text-sm sm:text-base text-white/70">Selected:</p>
                <p className="text-base sm:text-lg text-white font-bold">{selectedMantra.name_te || selectedMantra.name}</p>
                {selectedMantra.name_te && (
                  <p className="text-xs sm:text-sm text-white/60">{selectedMantra.name}</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-lg text-white">Select a Mantra</p>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform text-sacred-400 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/8 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
            {mantras.map((mantra) => (
              <button
                key={mantra.id}
                onClick={() => handleSelect(mantra)}
                className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/12 transition border-b border-white/10 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base sm:text-lg font-semibold text-white">{mantra.name_te || mantra.name}</p>
                    <p className="text-xs sm:text-sm text-white/60">{mantra.name_te ? mantra.name : mantra.name_devanagari}</p>
                  </div>
                  {mantra.color && (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-md"
                      style={{ backgroundColor: mantra.color }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
