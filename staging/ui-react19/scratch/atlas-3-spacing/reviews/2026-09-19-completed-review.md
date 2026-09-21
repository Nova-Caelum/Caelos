# Atlas Three · component review

All statuses are review notes, not approval for promotion.

## Agent identity & continuation
Source: components/chat/message.tsx → AgentMessage
Status: Pass
I do not like this. it feels like three separate components when i want it to feel like 1 unified one. Lets retry this. Give me a few options, true redesign. My rough notes are that the agent avatar card shouldn't even be there. they are not there in imessage. there should be the name only when there are multiple agents in the chat. I dont really love agent name up top and then line break and then message contents. I would love for the message to be in line with the agent name serving as an indenter. but i cant figure out how that would work with the chain of thought element we have and how the flow would evolve from thinking to executing within the chain of though to having that be preserved and viewable later on? curious if you have any good ideas for this? 

## User messages
Source: components/chat/message.tsx
Status: Explore
I like these and i think keeping it simple is the best best. But this looks just a bit too bland. Do you have any ideas to maybe spruce it up a bit? maybe the fill of the bubble reflects the diffusion gradient fill of our composer? what are your thoughts on that?

## Assistant text & appearance motion
Source: components/chat/message.tsx → MessageResponse
Status: Explore
SO i think text animation is better than the current, but still rough and i would like it smoother. More Buttery. for sure. And while I do love the loader, at that size it isn't doing much.. I would like you to explore both the improved flow of the motion and a better loading state. I have a few icons i really like, https://21st.dev/community/bookmarks?tab=all&preview=%2F%40ravikatiyar162%2Fcomponents%2Floader-4, https://21st.dev/community/bookmarks?tab=all&preview=%2F%4021st%2Fcomponents%2Fspiral-loader - i unfortunately cant download the code but it would be nice if you could check them out and replicate them... I think subtle loaders that arent as generic as we always see would be our goal. 

## Markdown & code
Source: components/chat/message.tsx → components/ai-elements/message.tsx
Status: Explore
I like these but i think they could be better. i think the outer card should be glass textured, our usual primitives, and the inner card should be a non-class card like it is now. but the coloring is off here - it looks like the inner card is the same color as the ground, which is NOT what we want. > the foundry isnt working right now but we have 4 different token system for cards to create depth. Ground -> elevated 1 -> Elevated 2 -> top. Chrome is another one but that is separate. Each of the token layers has a different color that got generated systematically from our CLH system. Glass, Plain, Graph texture are the only variables on those. See if you can find those token color schemes. 

## Waiting & loading
Source: components/chat/message.tsx → ThinkingMessage / PreviewMessage
Status: Explore
These screens arent loading. Please refresh. So there doesnt seem to be any waiting or loading on the candidate section?? On the current section the double icon of the nova loader and the waiting text is totally overkill. I also think the card boundary in the current state is too harsh and not what we want, it separates us from the world.  Unifying to chain of that for all waiting and loading is the best path... to an extent. If it is just one thinking step or waiting step,https://21st.dev/community/bookmarks?tab=all&preview=%2F%40ravikatiyar162%2Fcomponents%2Floader-4 -- i think this loader to the left of whatever step is happening. is the best loader. without the card border. When there are multiple though it should become The dropdown, which should be closed by default, but the user can open it for thinking or anything to reveal the though process text. It shouldn't be open by default though. I put a whole bunch of code in the steps and work progress.  When the steps become more than one it turns into the dropdown with the number of steps, as it is here.

## Thinking disclosure
Source: components/chat/message-reasoning.tsx → components/ai-elements/reasoning.tsx
Status: Explore
See above. for how to do thinking... but also there is no motion on the candidate site, so I dont actually know how the text streaming will work. The old text animation is terrible though. I think we are improving one for a thing above so that new animation can be used here as well. There should be an icon to the left of "thinking" that mirrors the wrench icon for tools. It should not be a brain though... give me a few options. 

## Tool calls & results
Source: components/chat/message.tsx → tool-getWeather / Weather
Status: Explore
So see above for the thinking and below for the steps. We need to unify tools, thinking, and steps into one identity and primitive that can be combined into chain of thought. I think tool is the one that should get a dropdown that is a real card for the code, or text but i think there still shouldnt be an overall outline border of the tool. Does that make sense? But the static status of the tool call to the right of the tool name is great!

## Tool permissions
Source: components/chat/message.tsx → ToolApprovalActions
Status: Explore
So see above about the outer border of the tool call card. I like the current one more than the candidate one too be honest. I think allow should have the command+Enter keyboard shortcut in light text within the button as that will be the keyboard shortcut. I think the buttons could be larger though, with a much tighter but also more centered margin where there is cushion on all sides. Currently there isnt enough space on the top and way too much space to the right and below. I also think there should be a tonal button to the left side with the tab as the shortcut that is "Clarify" or "Ask Question" or something (i'll let you come up with some options) that clicking pulls up an input field that you have to fill. And i want to say!!! the buttons for the permission shouldnt go within the tool call card. They should go directly above the composer it's own: Permission Required. Or Input Required. That has the tool request for the tool cool and why it is being requested in plain english and the code block if it is a code command. Does that make sense?

## Questions & questionnaires
Source: Not wired in staging
Status: Explore
This is great, but the card should be an actual nova caelum primitive based card component with better text formatting and selection of the actual question. The "Question 1 of 2" should be on the top right with < and > to toggle between the questions. and like the permission field. the questions should be in line, but it should snap down so the composer becomes the text input field and the normal enter button replaces the next question. Our maybe the next question becomes the enter button on the composer??? that would be super cool. 

## Attachments & uploads
Source: components/chat/preview-attachment.tsx
Status: Pass
I think neither of these. the attachment should be a rectangle card or chip with an icon to the left based on what kind of file it is (picture, doc, code, whatever) and then full name of the file after that. Clicking on it should pull it up in the preview. 

## Upload failure & retry
Source: Not wired in staging
Status: Pass
This sucks... reuse the notes from above, and if the upload fail have the icon being an X and the outline being red with a red glow. 

## Inline artifact
Source: components/chat/document-preview.tsx
Status: Explore
Keep what we have currently that is way way better. But the format should mirror the tool and thinking elements above. the icon and title should be in free space as a text button with a chevron to the right. Clicking the chevron reveals this glass card with the preview as it is now. On the right top corner should be the expand button but also a download, and copy icon that with tooltip species copy filepath. 

## Expanded artifact workspace
Source: components/chat/artifact.tsx
Status: Explore
So for one... the pill on the back right is terrible. Truly truly terrible. it is so horrendously out of reach. Huge adjustment there. I dont think the buttons are the worst, but there should def be a pull up in file editor as full screen button. Lets have the toolpill be top left edge, with the pill's right edge aligned with the cards left side edge with maybe 3 px of cushion. Also the right side panel does not need to be the chrome. it creates too sharp of a gradient with the chat. The card of the doc should be 1 elevation degree higher than the background of the chat, it can maybe have a header bar made out of chrome to replace what it is now but the doc title should be replaced with the actual file name, and the updated 12 hours ago is fine. It should be tighter than what it is now. We want this card to feel like it exists in the same world as the chat. But the the card should come over onto the same surface as the chat so it feels seamless. The X on top header of the drawer should be replaced with a like toggle side panel button. and the x on the pill toolbar should be replaced with a >> icon that collapses it into the document card. Otherwise i think thats good. 

## Message actions
Source: components/chat/message-actions.tsx via PreviewMessage
Status: Keep
Great

## Citations & sources
Source: Not wired in staging
Status: Pass
They shouldnt just be a number... they should be a small inline chip that has like one little section of the text so i know what it is, and the tooltip reveals the whole source link and title. but is not a full card the way it is now. 

## Web preview
Source: Not wired in staging
Status: Pass
this is terrible. The web preview should function exactly the same as the inline artifact in everyway. 

## Steps & work progress
Source: Not wired in staging
Status: Explore
I think for a chain of thought and action loading. instead of an extra loading icon.... having this border beam around a pill or chip or text card with invisible outline and fill for  the chain of thought element as a way to signify loading would be really cool. as for the dropdown: npx ai-elements@latest add task ; https://elements.ai-sdk.dev/components/task and npx shadcn add "https://prompt-kit.com/c/chain-of-thought.json" ; https://www.prompt-kit.com/docs/chain-of-thought -- this also has a really good formation. the line segment connecting each step / item / tool call i think is really effective in tying it all together. I really like that files have their own chip in the elements.ai-sdk one, but i really like the line connecting icons that are specific for that particular step in the chain. I want to incorporate both. 

Coming back. Ive written this a thousand times now. Steps, thought, tool, waiting are all one element that gets unified. The states are single, or chain. And we discussed them above. 

## Delegation & sub-agents
Source: Not wired in staging
Status: Pass
This is terrible - a subagent should exactly the way a tool call does except with a little agent icon. clicking the dropdown gives a small inline preview of what it's doing, and clicking the expand just like the web preview and artifact lets you see the session as a right side drawer. 

## Conversation navigation
Source: components/chat/messages.tsx → useMessages
Status: Explore
When you get up too far to the top there should be a down arrow button right above the composer. and that arrow should become the nova loader in a circle chip when something is loading but we have scrolled way up to the top. 

## Unread boundary
Source: Not wired in staging
Status: Pass
the spacing is terrible and so bland. I hate it... you get one more chance to try something better that is more inline, i think a light separator line that marks where all the new messages that i havent read start is better. 

## Interruption & recovery
Source: Not wired in staging
Status: Explore
This is pretty fine but we have primitives and components for error messages right? they should be in the foundry and have like Red edges and red text with the tonal button. It shouldn't be a recover text button it should be a retry arrow icon within a tonal button. 

## Empty conversation
Source: components/chat/greeting.tsx
Status: Keep
No notes yet.

## Composer · locked reference
Source: components/chat/multimodal-input.tsx → shared Composer
Status: Keep
Flawless. Thank you. 