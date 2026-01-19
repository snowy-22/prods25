/**
 * Create first folder from landing page demo data
 * Called after user signs up from landing page demo
 */

import { createClient } from './supabase/client';

export interface DemoSaveData {
  page: number;
  cards: any[];
  timestamp: string;
  pageTitle: string;
}

export async function createFirstFolderFromDemo(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Check flag
    const shouldCreate = localStorage.getItem('create-first-folder-from-demo');
    if (!shouldCreate) {
      return false;
    }
    
    // Get saved demo data
    const savedDemoStr = localStorage.getItem('landing-demo-save');
    if (!savedDemoStr) {
      return false;
    }
    
    const demoData: DemoSaveData = JSON.parse(savedDemoStr);
    
    // Create folder with demo cards as items
    const folderName = `${demoData.pageTitle} - İlk Klasörüm`;
    const folderId = `folder-${Date.now()}`;
    
    const folderItem = {
      id: folderId,
      user_id: userId,
      folder_id: null, // Root folder
      item_id: folderId,
      item_data: {
        id: folderId,
        type: 'folder',
        title: folderName,
        description: `Landing demo'dan oluşturuldu: ${demoData.pageTitle}`,
        icon: '🎬',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeletable: true,
        order: 0
      },
      size_bytes: 1024,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save folder
    const { error: folderError } = await supabase
      .from('folder_items')
      .insert(folderItem);
    
    if (folderError) {
      console.error('Error creating first folder:', folderError);
      return false;
    }
    
    // Save cards as items in the folder
    for (let i = 0; i < demoData.cards.length; i++) {
      const card = demoData.cards[i];
      const itemId = `item-${Date.now()}-${i}`;
      
      const cardItem = {
        id: itemId,
        user_id: userId,
        folder_id: folderId,
        item_id: itemId,
        item_data: {
          id: itemId,
          type: card.type === 'widget' ? 'widget' : 'player',
          title: card.title,
          url: card.url,
          widgetType: card.widgetType,
          gradient: card.gradient,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: i,
          x: (i % 3) * 350,
          y: Math.floor(i / 3) * 250,
          width: 320,
          height: 240
        },
        size_bytes: 512,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await supabase
        .from('folder_items')
        .insert(cardItem);
    }
    
    // Clear flags
    localStorage.removeItem('create-first-folder-from-demo');
    localStorage.removeItem('landing-demo-save');
    
    console.log(`✅ Created first folder from demo: ${folderName}`);
    
    // Now create random tab folders if they exist
    const randomTabsStr = localStorage.getItem('landing-demo-random-tabs');
    if (randomTabsStr) {
      const randomTabs = JSON.parse(randomTabsStr);
      
      for (let tabIdx = 0; tabIdx < randomTabs.length; tabIdx++) {
        const tab = randomTabs[tabIdx];
        const randomFolderId = `folder-random-${Date.now()}-${tabIdx}`;
        const randomFolderName = `🎲 ${tab.title || `Rastgele Klasör ${tabIdx + 1}`}`;
        
        // Create random folder
        const randomFolder = {
          id: randomFolderId,
          user_id: userId,
          folder_id: null, // Root folder
          item_id: randomFolderId,
          item_data: {
            id: randomFolderId,
            type: 'folder',
            title: randomFolderName,
            description: `Landing demo'dan oluşturulan rastgele klasör`,
            icon: '🎲',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeletable: true,
            order: tabIdx + 1
          },
          size_bytes: 1024,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await supabase.from('folder_items').insert(randomFolder);
        
        // Save cards in random folder
        for (let i = 0; i < tab.cards.length; i++) {
          const card = tab.cards[i];
          const randomItemId = `item-random-${Date.now()}-${tabIdx}-${i}`;
          
          const cardItem = {
            id: randomItemId,
            user_id: userId,
            folder_id: randomFolderId,
            item_id: randomItemId,
            item_data: {
              id: randomItemId,
              type: card.type === 'widget' ? 'widget' : 'player',
              title: card.title,
              url: card.url,
              widgetType: card.widgetType,
              gradient: card.gradient,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              order: i,
              x: (i % 3) * 350,
              y: Math.floor(i / 3) * 250,
              width: 320,
              height: 240
            },
            size_bytes: 512,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await supabase.from('folder_items').insert(cardItem);
        }
        
        console.log(`✅ Created random folder: ${randomFolderName}`);
      }
      
      // Clear random tabs storage
      localStorage.removeItem('landing-demo-random-tabs');
    }
    
    return true;
  } catch (error) {
    console.error('Error in createFirstFolderFromDemo:', error);
    return false;
  }
}
